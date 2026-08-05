# Contributing

Thanks for taking the time to contribute. This project has two independent
packages — `backend/` (Node/Express/MongoDB) and `frontend/` (React/Vite) — each
with its own dependencies, tests, and linter.

## Getting set up

Follow [Installation](README.md#installation) and [Setup](README.md#setup) in the
main README, or use the [Docker development stack](README.md#docker) if you'd
rather not install Node/MongoDB locally.

## Branching

Branch off `main`:

```
<type>/<short-description>
```

Where `<type>` is one of `feat`, `fix`, `refactor`, `docs`, `test`, or `chore` —
e.g. `feat/task-labels`, `fix/refresh-token-race`.

## Commit messages

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

<optional body — the "why", not the "what">
```

Examples:

```
feat(tasks): add due-date range filter to task list
fix(auth): invalidate refresh token on password reset
docs(readme): document Docker production compose file
```

`<scope>` is typically the module you touched (`auth`, `projects`, `tasks`,
`admin`, `notifications`, ...).

## Before opening a pull request

Both packages must pass their own checks — run them from within `backend/` and
`frontend/` respectively:

```bash
npm run lint
npm test
```

The backend additionally enforces a minimum coverage threshold
(`npm run test:coverage` — see [jest.config.js](backend/jest.config.js)); a PR
that drops coverage below 80% on any metric will fail CI-equivalent local runs.

If you touched an API route's request/response shape, update its `@swagger`
JSDoc block in `backend/src/routes/*.js` and regenerate the Postman collection:

```bash
cd backend
npm run docs:postman
```

If you touched a Mongoose model's fields or relationships, update
`docs/ER_DIAGRAM.md` (and `docs/DATABASE_SCHEMA.md` if it's a new collection
or relationship) to match.

## Pull request checklist

- [ ] Lint passes on both packages
- [ ] Tests pass on both packages (and you added tests for new behavior)
- [ ] Swagger/Postman docs updated if an API contract changed
- [ ] `ER_DIAGRAM.md` updated if a schema changed
- [ ] No secrets, `.env` files, or credentials committed

## Code style

- Match the conventions already in the file you're editing over introducing a
  new pattern — this codebase favors small, single-purpose modules (one
  service/controller/hook per concern) over shared abstractions.
- Backend: routes stay thin (validation + middleware wiring only); business
  logic lives in `services/`; controllers just call a service and shape the
  response.
- Frontend: server state goes through TanStack Query hooks in `hooks/`, not
  component-local `useEffect` fetches; shared UI state (auth, theme, toasts)
  lives in the Redux slices under `redux/slices/`.
- Don't add a dependency for something a few lines of code can do.

## Reporting bugs / requesting features

Open an issue with steps to reproduce (for bugs) or the problem you're trying
to solve (for features) — a concrete use case is more useful than a proposed
implementation.
