# Tests Style Guide

## Structure
- `/tests/frontend` → Component + integration tests
- `/tests/backend` → Unit + integration tests
- `/tests/e2e` → End-to-end tests (frontend + backend flows)

## Naming
- Tests must use descriptive naming:
  `should_doThing_when_condition`

## Coverage
- Backend → Unit + integration
- Frontend → Unit + integration
- E2E → Required for every feature (new or updated)

## Environment
- Use `.env.test` (extends root `.env`).
- Tests must not rely on production data.

## Execution
- All tests runnable via a single command (`npm test`, etc.).
- Agents must execute tests before finishing work.
- E2E tests must be modular and runnable independently.

## Documentation
- `README.md` → explains how to run tests (user-facing).
- `DEVELOPER.md` → explains test strategy + CI (agent-facing).
