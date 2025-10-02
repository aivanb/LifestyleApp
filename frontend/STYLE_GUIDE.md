# Frontend Style Guide

## Structure
- `/components` → UI components
- `/pages` → Screens / routes
- `/hooks` → Custom hooks
- `/services` → API calls
- `/styles` → Global styles

## Naming
- Components → `PascalCase`
- Hooks → `useCamelCase`
- Functions/vars → `camelCase`
- Files → match main export name

## Styling
- Prefer TailwindCSS or project standard CSS solution.
- No inline styles unless dynamic.
- Theming and colors must come from config.

## API Communication
- All API calls go through `/services`.
- Must use `.env` variables (e.g. `process.env.API_URL`).

## Testing
- Unit tests for all components.
- Integration tests for flows.
- E2E tests for UI features placed under `/tests/e2e/frontend`.

## Documentation
- Docstrings for components and hooks.
- Add agent-facing integration notes in `DEVELOPER.md`.
- Keep user-facing `README.md` updated with setup and usage.
