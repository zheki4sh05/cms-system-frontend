# Agent Guidelines for Compliance Management Frontend

This document provides guidelines for AI agents working on this React/TypeScript codebase. It covers build commands, code style, architecture, and key patterns.

**Key Technologies**: React 19 + TypeScript, Vite, MobX, Material‑UI, React Router, Axios, MSW, ESLint.

## Build and Development Commands

```bash
# Start development server on port 3000
npm run dev

# Build for production (runs tsc -b then vite build)
npm run build

# Lint all files with ESLint
npm run lint

# Preview production build locally
npm run preview
```

**Note**: There are no dedicated test commands in package.json. The project uses MSW for API mocking but does not currently have unit tests. Consider adding Vitest if testing is needed.

## Code Style Guidelines

### TypeScript and Imports

**TypeScript Configuration**: Strict settings enabled (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `experimentalDecorators` for MobX).

**Imports Order**:
1. React and React-related imports
2. Third-party libraries
3. MUI components (grouped by source)
4. Internal path aliases (`@app/*`, `@pages/*`, etc.)
5. Relative imports

See `Sidebar.tsx` for a typical example.

### Naming Conventions

- **Components**: PascalCase (e.g., `Sidebar`, `NotificationPanel`)
- **Files**: PascalCase for components, camelCase for utilities/stores (e.g., `Sidebar.tsx`, `notificationStore.ts`)
- **Interfaces/Types**: PascalCase (e.g., `Department`, `CreateDepartmentRequest`)
- **Variables/Functions**: camelCase (e.g., `authStore`, `handleNavigate`)
- **Constants**: UPPER_SNAKE_CASE for true constants, otherwise camelCase
- **Path Aliases**: Use the defined aliases (`@shared`, `@features`, etc.) instead of relative paths for cross‑slice imports

### Patterns & Conventions

**Component Patterns**
- Use `type FC<Props>` for functional components with explicit prop typing
- Wrap MobX‑observed components with `observer()` from `mobx-react-lite`
- Define `interface Props` (or `interface ComponentNameProps`) above the component
- Use destructured props in the component signature
- Keep UI logic in components; business logic in stores
- See `Sidebar.tsx` for a typical example

**MobX Store Patterns**
- Use `makeAutoObservable` in constructor (not `makeObservable`)
- Use `runInAction` for state updates after async operations
- Keep stores as classes with observable properties, actions, and computed getters
- Initialize stores with an `initialize()` method that loads data and sets up WebSocket connections
- Clean up resources (WebSocket, intervals) in a `cleanup()` method
- Export a singleton instance of the store (e.g., `export const notificationStore = new NotificationStore()`)
- See `notificationStore.ts` for a complete implementation

**Error Handling**
- Use `try/catch` blocks for async operations
- Log errors with `console.error` (no custom error reporting observed)
- In API clients, handle token refresh and authentication errors globally via interceptors
- Do not swallow errors silently; at minimum log them

**API Client Patterns**
- The `apiClient` (axios instance) is configured in `@shared/lib/api/apiClient.ts`
- It includes request/response interceptors for automatic token refresh
- Always use `apiClient` for HTTP requests; do not create new axios instances
- API functions are grouped by domain (e.g., `notificationApi.ts`, `departmentApi.ts`)
- Each API file exports a plain object with methods that return promises
- Example: `NotificationApi.getNotifications(params)`

**Styling with MUI and Emotion**
- Use MUI components with Emotion `sx` prop for inline styles
- For complex styles, consider `styled` from `@emotion/styled`
- Theme is provided via `ThemeProvider` (see `src/app/providers/ThemeProviders.tsx`)
- Use the theme tokens (e.g., `primary.main`, `divider`) when possible

### Path Aliases

The following aliases are configured in `tsconfig.app.json` and `vite.config.ts`:

- `@app/*` → `./src/app/*`
- `@pages/*` → `./src/pages/*`
- `@widgets/*` → `./src/widgets/*`
- `@features/*` → `./src/features/*`
- `@entities/*` → `./src/entities/*`
- `@shared/*` → `./src/shared/*`

Always use these aliases for imports across slices. Relative imports are allowed within the same slice.

### Architecture (Feature‑Sliced Design)

The project follows a variant of Feature‑Sliced Design:

- **app/**: Application bootstrapping, providers, global styles
- **pages/**: Page‑level components (each page is a folder with its own component)
- **widgets/**: Reusable complex UI blocks (sidebar, header, layout drawers)
- **features/**: Feature‑specific logic and UI (auth, profile)
- **entities/**: Business entities (not heavily used in current codebase)
- **shared/**: Shared utilities, types, stores, API clients, hooks, configs
- **mocks/**: MSW handlers and mock data

When adding new functionality:
1. Place page components under `pages/`
2. Create reusable UI components in `widgets/` or `shared/ui` (if needed)
3. Store business logic in `features/*/model` or `shared/stores`
4. Define types in `shared/types/*`
5. Add API calls in `shared/lib/api/*`

### ESLint Rules

The ESLint configuration (`eslint.config.js`) includes:

- `@eslint/js` recommended rules
- `typescript-eslint` recommended rules
- `eslint-plugin-react-hooks` recommended rules
- `eslint-plugin-react-refresh` vite configuration

Run `npm run lint` to check for violations. No Prettier is configured; formatting is left to the editor.

### Mocking with MSW

- MSW handlers are in `src/mocks/handlers/`
- The main handler file is `src/mocks/handlers.ts` that aggregates all handlers
- Mock data is in `src/mocks/mockData.ts`
- To enable mocking, ensure the mock service worker is started (see `src/mocks/browser.ts` and `src/mocks/index.ts`)

### Environment Variables

- `VITE_API_BASE_URL`: Base URL for the backend API (default: `http://localhost:8080/api`)
- Access via `import.meta.env.VITE_API_BASE_URL`

## Summary of Key Points for Agents

1. **Always run `npm run lint` after making changes** – the CI may enforce linting.
2. **Use path aliases** – never use deep relative paths like `../../../shared`.
3. **Follow MobX patterns** – `makeAutoObservable`, `runInAction`, singleton stores.
4. **Handle errors** – log errors with `console.error`; do not ignore them.
5. **Keep components lean** – move logic to stores or custom hooks.
6. **Respect TypeScript strictness** – no unused variables/parameters, explicit types.
7. **Use MUI components** – avoid reinventing UI elements.
8. **Maintain import order** – React → third‑party → internal aliases → relatives.

If you encounter Cursor or Copilot rules (`.cursorrules`, `.github/copilot-instructions.md`), incorporate them into this guide.