# Database schema

MongoDB via Mongoose, 8 collections. Every collection uses the shared
`softDeletePlugin` (`isDeleted`/`deletedAt` + query-level filtering) — see
[`ER_DIAGRAM.md`](ER_DIAGRAM.md) for the full field list, relationships, and
indexing strategy for each one.

| Model | Purpose | Key relationships |
| --- | --- | --- |
| **User** | Accounts, auth, RBAC | Owns/reports/authors/uploads most other collections |
| **Project** | Top-level container for work | `owner` (User), `members` (User[]) |
| **Task** | Unit of work inside a project | `project`, `reporter` (User), `assignees` (User[]), `parentTask` (self, for subtasks), `checklist` (embedded items) |
| **Comment** | Discussion on a task | `task`, `author` (User), `parentComment` (self, for threads), `mentions` (User[]) |
| **Attachment** | Uploaded file | Exactly one of `task` / `project` / `comment`, plus `uploadedBy` (User) |
| **Notification** | In-app alert | `recipient`/`sender` (User), polymorphic `entityType`+`entityId` |
| **AuditLog** | Immutable action history | `user` (User, nullable for system actions), polymorphic `entityType`+`entityId` |
| **Team** | Admin-managed grouping of users | `lead` (User), `members` (User[]) |

## Task status and priority

`Task.status` — additive over time, so older data stays valid:
`todo` · `in_progress` · `in_review` · `testing` · `done` · `cancelled`

`Task.priority`: `low` · `medium` · `high` · `critical`

## Soft deletes

Every model shares one plugin (`backend/src/models/plugins/softDelete.js`):
a delete sets `isDeleted: true` / `deletedAt`, and every `find`-style query is
transparently filtered to exclude soft-deleted documents unless the caller
opts in with `.withDeleted()` or `.onlyDeleted()`. Nothing is ever actually
removed from the database through the normal API surface.
