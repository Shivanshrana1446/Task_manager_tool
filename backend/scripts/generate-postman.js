/**
 * Generates a Postman v2.1 collection + environment straight from the
 * Swagger/OpenAPI spec (src/docs/swagger.js), so the two never drift apart.
 *
 * Usage: node scripts/generate-postman.js
 * Output: docs/postman/TaskManager.postman_collection.json
 *         docs/postman/TaskManager.postman_environment.json
 */
const fs = require('fs');
const path = require('path');
const spec = require('../src/docs/swagger.js');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'postman');

// ---- Resolve every $ref against the spec so examples/schemas are inlined ----
const resolveRef = (ref) => {
  const parts = ref.replace(/^#\//, '').split('/');
  let node = spec;
  for (const p of parts) node = node?.[p];
  return node;
};

const deref = (node, seen = new Set()) => {
  if (Array.isArray(node)) return node.map((item) => deref(item, seen));
  if (node && typeof node === 'object') {
    if (typeof node.$ref === 'string') {
      if (seen.has(node.$ref)) return {};
      const resolved = resolveRef(node.$ref);
      return deref(resolved, new Set([...seen, node.$ref]));
    }
    const out = {};
    for (const [key, value] of Object.entries(node)) out[key] = deref(value, seen);
    return out;
  }
  return node;
};

const derefSpec = deref(spec);

// ---- Helpers ----
const toPostmanPath = (openApiPath) => openApiPath.replace(/\{([^}]+)\}/g, ':$1');

const pathVariables = (openApiPath) => {
  const matches = [...openApiPath.matchAll(/\{([^}]+)\}/g)];
  return matches.map(([, name]) => ({
    key: name,
    value: `REPLACE_WITH_${name.toUpperCase()}`,
  }));
};

const jsonExample = (contentByType) => {
  const content = contentByType?.['application/json'];
  if (!content) return null;
  if (content.example !== undefined) return content.example;
  if (content.examples) {
    const first = Object.values(content.examples)[0];
    return first?.value ?? null;
  }
  return null;
};

const buildFormData = (schema) => {
  const properties = schema?.properties || {};
  const required = new Set(schema?.required || []);
  return Object.entries(properties).map(([key, prop]) => ({
    key,
    type: prop.format === 'binary' ? 'file' : 'text',
    value: prop.format === 'binary' ? undefined : prop.example ?? '',
    disabled: !required.has(key),
  }));
};

const buildResponseExamples = (operation, postmanRequest) =>
  Object.entries(operation.responses || {})
    .filter(([status]) => status !== 'default')
    .map(([status, response]) => {
      const body = jsonExample(response.content);
      return {
        name: `${status} — ${response.description || ''}`.trim(),
        originalRequest: postmanRequest,
        status: statusText(status),
        code: Number(status),
        _postman_previewlanguage: 'json',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: body !== null ? JSON.stringify(body, null, 2) : '',
      };
    });

const statusText = (code) =>
  ({
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
  }[code] || '');

const AUTO_TOKEN_CAPTURE = `
const body = pm.response.json();
if (body?.data?.accessToken) {
  pm.collectionVariables.set('accessToken', body.data.accessToken);
  console.log('Saved accessToken to collection variable.');
}
`.trim();

const buildRequestItem = (openApiPath, method, operation) => {
  const postmanPath = toPostmanPath(openApiPath);
  const urlVars = pathVariables(openApiPath);
  const queryParams = (operation.parameters || [])
    .filter((p) => p.in === 'query')
    .map((p) => ({
      key: p.name,
      value: p.schema?.default !== undefined ? String(p.schema.default) : '',
      description: p.description || '',
      disabled: true,
    }));

  const requestBody = operation.requestBody;
  let body;
  let extraHeaders = [];

  if (requestBody?.content?.['application/json']) {
    const example = jsonExample(requestBody.content);
    body = { mode: 'raw', raw: JSON.stringify(example ?? {}, null, 2), options: { raw: { language: 'json' } } };
    extraHeaders = [{ key: 'Content-Type', value: 'application/json' }];
  } else if (requestBody?.content?.['multipart/form-data']) {
    body = { mode: 'formdata', formdata: buildFormData(requestBody.content['multipart/form-data'].schema) };
  }

  const isPublic = Array.isArray(operation.security) && operation.security.length === 0;

  const request = {
    method: method.toUpperCase(),
    header: extraHeaders,
    url: {
      raw: `{{baseUrl}}${postmanPath}${queryParams.length ? '?' + queryParams.map((q) => `${q.key}=`).join('&') : ''}`,
      host: ['{{baseUrl}}'],
      path: postmanPath.split('/').filter(Boolean),
      variable: urlVars.length ? urlVars : undefined,
      query: queryParams.length ? queryParams : undefined,
    },
    description: operation.description || operation.summary || '',
  };
  if (body) request.body = body;
  if (isPublic) request.auth = { type: 'noauth' };

  const item = {
    name: operation.summary || `${method.toUpperCase()} ${openApiPath}`,
    request,
    response: buildResponseExamples(operation, request),
  };

  if (openApiPath === '/auth/login' || openApiPath === '/auth/register') {
    item.event = [
      { listen: 'test', script: { type: 'text/javascript', exec: AUTO_TOKEN_CAPTURE.split('\n') } },
    ];
  }

  return item;
};

// ---- Group operations by tag (folder per resource) ----
const folders = new Map();
for (const [openApiPath, methods] of Object.entries(derefSpec.paths)) {
  for (const [method, operation] of Object.entries(methods)) {
    const tag = (operation.tags && operation.tags[0]) || 'Misc';
    if (!folders.has(tag)) folders.set(tag, []);
    folders.get(tag).push(buildRequestItem(openApiPath, method, operation));
  }
}

const tagOrder = derefSpec.tags.map((t) => t.name);
const items = tagOrder
  .filter((tag) => folders.has(tag))
  .map((tag) => ({
    name: tag,
    description: derefSpec.tags.find((t) => t.name === tag)?.description,
    item: folders.get(tag),
  }));

const collection = {
  info: {
    name: derefSpec.info.title,
    description: derefSpec.info.description,
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  auth: {
    type: 'bearer',
    bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }],
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5000/api/v1', type: 'string' },
    { key: 'accessToken', value: '', type: 'string' },
  ],
  item: items,
};

const environment = {
  id: 'task-manager-local',
  name: 'Task Manager — Local',
  values: [
    { key: 'baseUrl', value: 'http://localhost:5000/api/v1', type: 'default', enabled: true },
    { key: 'accessToken', value: '', type: 'secret', enabled: true },
  ],
  _postman_variable_scope: 'environment',
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  path.join(OUT_DIR, 'TaskManager.postman_collection.json'),
  JSON.stringify(collection, null, 2)
);
fs.writeFileSync(
  path.join(OUT_DIR, 'TaskManager.postman_environment.json'),
  JSON.stringify(environment, null, 2)
);

const totalRequests = items.reduce((sum, folder) => sum + folder.item.length, 0);
console.log(`Generated ${items.length} folders, ${totalRequests} requests -> ${OUT_DIR}`);
