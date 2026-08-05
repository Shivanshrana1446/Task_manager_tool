# API Examples

Companion reference to the interactive Swagger UI (`/api-docs`) and the Postman
collection (`docs/postman/`) — this doc is the fast, copy-pasteable version. All
three stay in sync with the same source: the JSDoc `@swagger` blocks in
`src/routes/*.js`, compiled by `src/docs/swagger.js`.

## Contents

- [Conventions](#conventions)
- [Authentication examples](#authentication-examples)
- [Error examples](#error-examples)
- [API examples by resource](#api-examples-by-resource)
- [Postman collection](#postman-collection)

All examples assume the API is running locally at `http://localhost:5000/api/v1`
(the default from `.env.example`) — swap in your own base URL as needed.

## Conventions

**Every response is wrapped the same way:**

```json
{ "success": true, "statusCode": 200, "message": "Projects fetched", "data": { "...": "..." } }
```

**Every error shares one shape** (`errors` is only populated for 422 validation failures):

```json
{ "success": false, "message": "Human-readable summary", "errors": [] }
```

**Auth:** send `Authorization: Bearer <accessToken>` on every request except
`POST /auth/register`, `POST /auth/login`, `POST /auth/refresh-token`,
`POST /auth/forgot-password`, and `POST /auth/reset-password/:token`.

**Pagination:** list endpoints accept `page`, `limit`, `sort` (e.g. `-createdAt`),
and `search`, and return:

```json
{ "page": 1, "limit": 20, "total": 42, "totalPages": 3, "hasNextPage": true, "hasPrevPage": false }
```

---

## Authentication examples

### 1. Register

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","password":"StrongPass1"}'
```

Always creates the account as `team_member`, regardless of any `role` field sent.
Returns an access token in the body and sets an httpOnly `refreshToken` cookie
(same as login, below).

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Registration successful",
  "data": {
    "user": {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Ada Lovelace",
      "email": "ada@example.com",
      "role": "team_member",
      "isActive": true,
      "avatar": { "url": null },
      "createdAt": "2026-01-15T09:30:00.000Z",
      "updatedAt": "2026-01-15T09:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWYxYTJiMyJ9.abc123"
  }
}
```

`409` if the email is already registered; `422` if the password doesn't meet the
policy (min 8 chars, one lowercase, one uppercase, one number).

### 2. Log in

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"StrongPass1"}'
```

`-c cookies.txt` saves the `refreshToken` cookie for step 4. Response body is the
same shape as register's, with `"message": "Login successful"`.

Wrong password or unknown email → `401 { "message": "Invalid email or password" }`.
Deactivated account → `401 { "message": "This account has been deactivated" }`.

### 3. Call an authenticated endpoint

```bash
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer <accessToken from step 2>"
```

### 4. Refresh the access token

```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh-token -b cookies.txt
```

No body needed — the httpOnly `refreshToken` cookie captured in step 2 does the
work. Returns a new `accessToken` (and rotates the refresh token/cookie).
`401` if the cookie is missing, malformed/expired, or was already invalidated by
a prior logout.

### 5. Log out

```bash
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -b cookies.txt \
  -H "Authorization: Bearer <accessToken>"
```

Invalidates the stored refresh token server-side and clears the cookie.

### 6. Forgot / reset password

```bash
curl -X POST http://localhost:5000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com"}'
```

Always returns the same generic `200` regardless of whether the email exists (no
account enumeration). In development (no SMTP configured), the reset link is
written to the server log instead of emailed.

```bash
curl -X POST http://localhost:5000/api/v1/auth/reset-password/<token-from-email> \
  -H "Content-Type: application/json" \
  -d '{"password":"NewStrongPass1","confirmPassword":"NewStrongPass1"}'
```

`400` if the token is invalid/expired; `422` if the passwords don't match or the
new password is too weak.

---

## Error examples

Every error response uses the shared shape from [Conventions](#conventions).
Below is every distinct error case the API produces, by HTTP status.

| Status | When | Example |
| --- | --- | --- |
| 400 | Malformed value for a typed field (Mongoose `CastError`) — a defensive fallback; every documented `:id` path param is already validated as a 422 before it reaches this point | `{ "success": false, "message": "Invalid value for '_id': not-an-id", "errors": [] }` |
| 401 | Missing/expired access token | `{ "success": false, "message": "Authentication required", "errors": [] }` |
| 401 | Expired/invalid access token | `{ "success": false, "message": "Invalid or expired access token", "errors": [] }` |
| 403 | Authenticated, but not allowed (wrong role, not the resource owner) | `{ "success": false, "message": "You do not have permission to perform this action", "errors": [] }` |
| 404 | Resource missing or soft-deleted | `{ "success": false, "message": "Project not found", "errors": [] }` |
| 409 | Duplicate unique field (e.g. registering an existing email) | `{ "success": false, "message": "email 'ada@example.com' is already in use", "errors": [] }` |
| 422 | Request body/query failed validation | `{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "A valid email is required" }] }` |
| 400 | Multipart upload rejected (wrong type/too large/wrong field name) | `{ "success": false, "message": "File is too large", "errors": [] }` |
| 429 | Rate limit exceeded (20 auth attempts/15 min, or 100 general API requests/15 min by default) | `{ "success": false, "message": "Too many requests, please try again later." }` — note: no `errors` key on this one, since it comes straight from the rate limiter, not the shared error handler |
| 500 | Unexpected server error | `{ "success": false, "message": "Internal Server Error", "errors": [] }` |

A 422 always includes one `{field, message}` entry per invalid field — for example,
submitting a project with a too-short `name` and a too-long `description`:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "name", "message": "Name must be 3-150 characters" },
    { "field": "description", "message": "Invalid value" }
  ]
}
```

(Some fields, like `description` here, have no custom `.withMessage()` on their
validator, so express-validator falls back to its generic `"Invalid value"`.)

---

## API examples by resource

The full endpoint list (60 endpoints across 10 resources) is documented in Swagger —
this section covers the most representative call of each.

### Projects

Create:

```bash
curl -X POST http://localhost:5000/api/v1/projects \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Apollo Launch","description":"Send the rocket up","priority":"high","dueDate":"2026-12-01T00:00:00.000Z"}'
```

List (admins see everything; everyone else sees only projects they own or belong to):

```bash
curl "http://localhost:5000/api/v1/projects?status=active&sort=-createdAt&page=1&limit=20" \
  -H "Authorization: Bearer <accessToken>"
```

Reassign the manager (the previous owner is automatically kept on as a member):

```bash
curl -X PATCH http://localhost:5000/api/v1/projects/<projectId>/manager \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"owner":"<newOwnerUserId>"}'
```

### Tasks

Create (assignees get notified):

```bash
curl -X POST http://localhost:5000/api/v1/tasks \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Design landing page","project":"<projectId>","assignees":["<userId>"],"priority":"high","dueDate":"2026-02-10T00:00:00.000Z"}'
```

Filter by due date range:

```bash
curl "http://localhost:5000/api/v1/tasks?dueAfter=2026-01-01&dueBefore=2026-03-01" \
  -H "Authorization: Bearer <accessToken>"
```

### Comments

```bash
curl -X POST http://localhost:5000/api/v1/comments \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Looks good — cc @grace","task":"<taskId>","mentions":["<userId>"]}'
```

### Attachments

```bash
curl -X POST http://localhost:5000/api/v1/attachments \
  -H "Authorization: Bearer <accessToken>" \
  -F "file=@./mockup-final.png" \
  -F "task=<taskId>"
```

Exactly one of `task`, `project`, or `comment` is required. Max 10MB; images, PDF,
Word/Excel, plain text, CSV, and ZIP are allowed.

### Notifications

```bash
curl http://localhost:5000/api/v1/notifications/unread-count \
  -H "Authorization: Bearer <accessToken>"

curl -X PATCH http://localhost:5000/api/v1/notifications/read-all \
  -H "Authorization: Bearer <accessToken>"
```

### Dashboard

```bash
curl http://localhost:5000/api/v1/dashboard/summary \
  -H "Authorization: Bearer <accessToken>"
```

Admins get org-wide metrics; everyone else gets a summary scoped to their own
projects and assigned tasks (see the `scope` field in the response).

### Users (admin actions)

```bash
curl -X PATCH http://localhost:5000/api/v1/users/<userId>/role \
  -H "Authorization: Bearer <adminAccessToken>" \
  -H "Content-Type: application/json" \
  -d '{"role":"project_manager"}'
```

### Teams (admin only)

```bash
curl -X POST http://localhost:5000/api/v1/teams \
  -H "Authorization: Bearer <adminAccessToken>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Platform Engineering","lead":"<userId>","members":["<userId2>"]}'
```

### Admin — audit logs, analytics, system health, roles

```bash
curl "http://localhost:5000/api/v1/admin/audit-logs?action=delete&entityType=Project" \
  -H "Authorization: Bearer <adminAccessToken>"

curl http://localhost:5000/api/v1/admin/analytics \
  -H "Authorization: Bearer <adminAccessToken>"

curl http://localhost:5000/api/v1/admin/system-health \
  -H "Authorization: Bearer <adminAccessToken>"
```

---

## Postman collection

Import both files from `docs/postman/` into Postman:

- `TaskManager.postman_collection.json` — all 60 requests, organized into one
  folder per resource, with example request bodies and saved example responses
  (including the error cases above) pulled straight from the Swagger spec.
- `TaskManager.postman_environment.json` — defines `baseUrl` (defaults to
  `http://localhost:5000/api/v1`) and an empty `accessToken` variable.

**Auth is wired up for you:** the collection's `Login` and `Register` requests
have a test script that automatically saves `data.accessToken` into the
`accessToken` collection variable, and every other request inherits a Bearer
token from that same variable — so the usual flow is just "run Login once, then
run anything else."

Path parameters (`:id`, `:userId`, ...) show up as editable variables on each
request's **Params** tab in Postman — fill in a real ID from a prior response
before sending.

To regenerate the collection after changing any `@swagger` JSDoc block:

```bash
cd backend
npm run docs:postman
```

This reads directly from `src/docs/swagger.js`, so the collection can never drift
out of sync with the Swagger spec.
