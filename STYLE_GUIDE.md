# Root Style Guide

## Repository Structure
- `/frontend` → Client UI and logic
- `/backend` → APIs, services, DB, business logic, middleware
- `/shared` → Reusable types, constants, utilities
- `/tests` → Unit, integration, and e2e tests
- `.env` → Environment variables (shared across all layers)

## Environment Variables
- Always define variables in a single `.env` at root.
- Each variable must be documented in `/docs/ENVIRONMENT.md`.

- No hardcoded secrets. Use `.env` + `.env.example`.

## Naming Conventions
- Variables/functions → `camelCase`
- Classes/components → `PascalCase`
- Constants → `UPPER_SNAKE_CASE`
- Database tables → `snake_case`

## Documentation
- Each directory (`frontend`, `backend`, `tests`) contains:
- `README.md` → user-focused
- `DEVELOPER.md` → agent-focused
- `STYLE_GUIDE.md` → style rules
- Root `README.md` and `DEVELOPER.md` provide global overview.

## Commenting
- Docstrings for all public functions, classes, modules.
- Inline comments only for intent, not restating code.

## Testing
- E2E tests are mandatory for new or updated features.
- All tests must run with a single command (`npm test`, `pytest`, etc.).
- Tests must pass before changes are complete.

## Integration
- Agents must check agent-facing docs to prevent duplicate code.
- New features must be modular and integrate smoothly.
