const swaggerJSDoc = require('swagger-jsdoc');
const env = require('../config/env');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Task Manager API',
    version: '1.0.0',
    description: `
API documentation for the Project & Task Management System.

## Authentication
Most endpoints require a JWT access token:

\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

Access tokens are short-lived (15m by default). \`POST /auth/login\` and \`POST /auth/register\`
return an \`accessToken\` in the response body **and** set an httpOnly \`refreshToken\` cookie.
When the access token expires, call \`POST /auth/refresh-token\` (cookie sent automatically by
the browser) to obtain a new one without asking the user to log in again. \`POST /auth/logout\`
invalidates the refresh token server-side and clears the cookie. See the **Auth** tag below for
worked examples of every step, including the error shape for a wrong password, a deactivated
account, and a duplicate-email registration.

## Response envelope
Every successful response is wrapped the same way:

\`\`\`json
{ "success": true, "statusCode": 200, "message": "Projects fetched", "data": { "...": "..." } }
\`\`\`

## Errors
Every error response — validation failures, auth failures, not-found, conflicts, or unexpected
server errors — shares one shape:

\`\`\`json
{ "success": false, "message": "Human-readable summary", "errors": [] }
\`\`\`

\`errors\` is populated (as \`{ field, message }\` pairs) only for 422 validation failures; it is
an empty array for every other error status. See the reusable **Unauthorized** / **Forbidden** /
**NotFound** / **Conflict** / **ValidationError** responses referenced throughout this document
for the exact message text each endpoint can return.

## Pagination
List endpoints accept \`page\`/\`limit\`/\`sort\`/\`search\` query parameters and return a
\`pagination\` object alongside the data — see **PaginationMeta** below.
    `.trim(),
  },
  servers: [
    {
      url: `http://localhost:${env.port}${env.apiPrefix}`,
      description: 'Local development server',
    },
    {
      url: env.apiPrefix,
      description: 'Same origin (reverse-proxied — e.g. the Docker/production nginx setup)',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication and session management' },
    { name: 'Users', description: 'User profiles and account administration' },
    { name: 'Projects', description: 'Project management' },
    { name: 'Tasks', description: 'Task management' },
    { name: 'Comments', description: 'Task comments and discussion threads' },
    { name: 'Attachments', description: 'File uploads' },
    { name: 'Notifications', description: 'In-app notifications' },
    { name: 'Dashboard', description: 'Aggregated dashboard metrics' },
    { name: 'Teams', description: 'Team management (admin only)' },
    { name: 'Admin', description: 'Audit logs, analytics, system health, and role overview (admin only)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Obtain a token from POST /auth/login or POST /auth/register.',
      },
    },
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', minimum: 1, default: 1 },
        description: 'Page number',
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        description: 'Items per page',
      },
      SortParam: {
        name: 'sort',
        in: 'query',
        schema: { type: 'string' },
        description: 'Comma-separated fields to sort by; prefix with "-" for descending (e.g. "-createdAt,title")',
      },
      SearchParam: {
        name: 'search',
        in: 'query',
        schema: { type: 'string' },
        description: 'Free-text search across the resource\'s searchable fields',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: { field: { type: 'string' }, message: { type: 'string' } },
            },
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
          hasNextPage: { type: 'boolean' },
          hasPrevPage: { type: 'boolean' },
        },
        example: { page: 1, limit: 20, total: 42, totalPages: 3, hasNextPage: true, hasPrevPage: false },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['admin', 'project_manager', 'team_member'] },
          isActive: { type: 'boolean' },
          avatar: {
            type: 'object',
            properties: { url: { type: 'string', nullable: true } },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        example: {
          _id: '65f1a2b3c4d5e6f7a8b9c0d1',
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          role: 'team_member',
          isActive: true,
          avatar: { url: 'https://res.cloudinary.com/demo/image/upload/v1/task-manager/avatars/ada.png' },
          createdAt: '2026-01-15T09:30:00.000Z',
          updatedAt: '2026-01-15T09:30:00.000Z',
        },
      },
      Project: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          owner: { type: 'string' },
          members: { type: 'array', items: { type: 'string' } },
          status: {
            type: 'string',
            enum: ['planning', 'active', 'on_hold', 'completed', 'archived'],
          },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          startDate: { type: 'string', format: 'date-time', nullable: true },
          dueDate: { type: 'string', format: 'date-time', nullable: true },
          taskStats: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              completed: { type: 'integer' },
              progress: { type: 'integer', description: 'Percentage, 0-100' },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        example: {
          _id: '65f2b3c4d5e6f7a8b9c0d1e2',
          name: 'Apollo Launch',
          description: 'Send the rocket up',
          owner: '65f1a2b3c4d5e6f7a8b9c0d1',
          members: ['65f1a2b3c4d5e6f7a8b9c0d2'],
          status: 'active',
          priority: 'high',
          startDate: '2026-01-01T00:00:00.000Z',
          dueDate: '2026-12-01T00:00:00.000Z',
          taskStats: { total: 8, completed: 3, progress: 38 },
          createdAt: '2026-01-15T09:30:00.000Z',
          updatedAt: '2026-02-01T12:00:00.000Z',
        },
      },
      Task: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          project: { type: 'string' },
          reporter: { type: 'string' },
          assignees: { type: 'array', items: { type: 'string' } },
          parentTask: { type: 'string', nullable: true },
          status: {
            type: 'string',
            enum: ['todo', 'in_progress', 'in_review', 'testing', 'done', 'cancelled'],
          },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          tags: { type: 'array', items: { type: 'string' } },
          startDate: { type: 'string', format: 'date-time', nullable: true },
          dueDate: { type: 'string', format: 'date-time', nullable: true },
          estimatedHours: { type: 'number', nullable: true },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
          actualHours: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        example: {
          _id: '65f3c4d5e6f7a8b9c0d1e2f3',
          title: 'Design landing page',
          description: 'First-pass hero + pricing sections',
          project: '65f2b3c4d5e6f7a8b9c0d1e2',
          reporter: '65f1a2b3c4d5e6f7a8b9c0d1',
          assignees: ['65f1a2b3c4d5e6f7a8b9c0d2'],
          parentTask: null,
          status: 'in_progress',
          priority: 'high',
          tags: ['frontend', 'design'],
          startDate: '2026-02-01T00:00:00.000Z',
          dueDate: '2026-02-10T00:00:00.000Z',
          estimatedHours: 6,
          completedAt: null,
          actualHours: 2.5,
          createdAt: '2026-02-01T09:00:00.000Z',
          updatedAt: '2026-02-03T14:20:00.000Z',
        },
      },
      Comment: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          content: { type: 'string' },
          task: { type: 'string' },
          author: { type: 'string' },
          parentComment: { type: 'string', nullable: true },
          mentions: { type: 'array', items: { type: 'string' } },
          isEdited: { type: 'boolean' },
          editedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
        example: {
          _id: '65f4d5e6f7a8b9c0d1e2f3a4',
          content: 'Looks good to me — cc @grace',
          task: '65f3c4d5e6f7a8b9c0d1e2f3',
          author: '65f1a2b3c4d5e6f7a8b9c0d1',
          parentComment: null,
          mentions: ['65f1a2b3c4d5e6f7a8b9c0d2'],
          isEdited: false,
          editedAt: null,
          createdAt: '2026-02-03T15:00:00.000Z',
        },
      },
      Attachment: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          fileName: { type: 'string' },
          originalName: { type: 'string' },
          url: { type: 'string' },
          mimeType: { type: 'string' },
          size: { type: 'number', description: 'Bytes' },
          task: { type: 'string', nullable: true },
          project: { type: 'string', nullable: true },
          comment: { type: 'string', nullable: true },
          uploadedBy: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        example: {
          _id: '65f5e6f7a8b9c0d1e2f3a4b5',
          fileName: 'task-manager/attachments/mockup-final.png',
          originalName: 'mockup-final.png',
          url: 'https://res.cloudinary.com/demo/image/upload/v1/task-manager/attachments/mockup-final.png',
          mimeType: 'image/png',
          size: 482913,
          task: '65f3c4d5e6f7a8b9c0d1e2f3',
          project: null,
          comment: null,
          uploadedBy: '65f1a2b3c4d5e6f7a8b9c0d1',
          createdAt: '2026-02-03T15:10:00.000Z',
        },
      },
      Notification: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          recipient: { type: 'string' },
          sender: { type: 'string', nullable: true },
          type: {
            type: 'string',
            enum: [
              'task_assigned',
              'task_updated',
              'task_completed',
              'comment_added',
              'mention',
              'project_invite',
              'project_manager_assigned',
              'project_updated',
              'due_date_reminder',
              'status_change',
            ],
          },
          title: { type: 'string' },
          message: { type: 'string' },
          isRead: { type: 'boolean' },
          readAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
        example: {
          _id: '65f6f7a8b9c0d1e2f3a4b5c6',
          recipient: '65f1a2b3c4d5e6f7a8b9c0d2',
          sender: '65f1a2b3c4d5e6f7a8b9c0d1',
          type: 'task_assigned',
          title: 'New task assigned',
          message: 'You were assigned to "Design landing page"',
          isRead: false,
          readAt: null,
          createdAt: '2026-02-01T09:00:05.000Z',
        },
      },
      Team: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          lead: { type: 'string' },
          members: { type: 'array', items: { type: 'string' } },
          memberCount: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        example: {
          _id: '65f7a8b9c0d1e2f3a4b5c6d7',
          name: 'Platform Engineering',
          description: 'Owns core infra and developer tooling',
          lead: '65f1a2b3c4d5e6f7a8b9c0d1',
          members: ['65f1a2b3c4d5e6f7a8b9c0d2', '65f1a2b3c4d5e6f7a8b9c0d3'],
          memberCount: 2,
          createdAt: '2026-01-20T10:00:00.000Z',
          updatedAt: '2026-01-20T10:00:00.000Z',
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          user: { $ref: '#/components/schemas/User' },
          action: {
            type: 'string',
            enum: [
              'create',
              'update',
              'delete',
              'restore',
              'status_change',
              'assign',
              'login',
              'logout',
              'comment',
              'upload',
            ],
          },
          entityType: {
            type: 'string',
            enum: ['User', 'Project', 'Task', 'Comment', 'Attachment', 'Team'],
          },
          entityId: { type: 'string' },
          before: { type: 'object', nullable: true },
          after: { type: 'object', nullable: true },
          ipAddress: { type: 'string', nullable: true },
          userAgent: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
        example: {
          _id: '65f8b9c0d1e2f3a4b5c6d7e8',
          user: { _id: '65f1a2b3c4d5e6f7a8b9c0d1', name: 'Ada Lovelace' },
          action: 'update',
          entityType: 'Project',
          entityId: '65f2b3c4d5e6f7a8b9c0d1e2',
          before: { status: 'planning' },
          after: { status: 'active' },
          ipAddress: '203.0.113.42',
          userAgent: 'Mozilla/5.0',
          createdAt: '2026-02-01T08:00:00.000Z',
        },
      },
    },
    responses: {
      ValidationError: {
        description: 'Request body/query failed validation',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              message: 'Validation failed',
              errors: [{ field: 'email', message: 'A valid email is required' }],
            },
          },
        },
      },
      Unauthorized: {
        description: 'Missing, invalid, or expired access token',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { success: false, message: 'Authentication required', errors: [] },
          },
        },
      },
      Forbidden: {
        description: 'Authenticated, but not allowed to perform this action',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              message: 'You do not have permission to perform this action',
              errors: [],
            },
          },
        },
      },
      NotFound: {
        description: 'The requested resource does not exist (or was soft-deleted)',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { success: false, message: 'Resource not found', errors: [] },
          },
        },
      },
      Conflict: {
        description: 'The request conflicts with existing data (e.g. duplicate email)',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { success: false, message: "email 'ada@example.com' is already in use", errors: [] },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJSDoc(options);
