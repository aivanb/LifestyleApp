# Backend Style Guide

## Structure
- `/routes` → API routes
- `/controllers` → Request handling
- `/services` → Business logic
- `/middleware` → Auth, validation, error handling, logging
- `/models` → Database schemas / ORM
- `/utils` → Helpers

## Naming
- Functions/vars → `camelCase`
- Classes → `PascalCase`
- Database tables → `snake_case`
- Middleware → descriptive (e.g. `authMiddleware.js`)

## Middleware
- All cross-cutting concerns (auth, validation, error handling, logging) go in `/middleware`.
- Each middleware must be tested.

## API Design
- Responses must be `{ data, error }` consistently.
- Use proper status codes.
- Input validation required (middleware or schema).

## Database Access
- Always parameterized queries or ORM (no raw unsafe queries).
- Use `.env` for DB credentials.

## Testing
- Unit tests for services and middleware.
- Integration tests for routes and DB.
- E2E tests under `/tests/e2e/backend`.

## Documentation
- Swagger/OpenAPI annotations for all routes.
- Agent-facing integration details in `DEVELOPER.md`.
- Update `README.md` with usage and setup.
