# Effortum - Copilot Instructions

## Project Overview

**Effortum** is a client-side time tracking application that stores all data in IndexedDB (browser local storage). Built with React, TanStack Router, Zustand state management, and Mantine UI components. Deployed to Netlify.

- **Tech Stack**: React 19, TypeScript, Vite 7, TanStack Router/Start, Zustand, Dexie (IndexedDB), Mantine UI, dayjs
- **Runtime**: Node.js LTS (see `.nvmrc`), runs on port 3000
- **Build Target**: Netlify SSR with client-side rendering disabled (`ssr: false` in routes)
- **Size**: Small (~50 source files), single-page application with minimal routing

## Build & Development Commands

### Critical: Command Execution Order

**ALWAYS run `npm install` before any other command.** The project uses npm (not yarn/pnpm).

```bash
# 1. Install dependencies (REQUIRED FIRST)
npm install

# 2. Development server (runs on http://localhost:3000)
npm run dev

# 3. Build for production (takes ~4-16 seconds)
npm run build
# Outputs to: .tanstack/start/build/ and .netlify/functions-internal/

# 4. Run unit tests (Vitest, watch mode by default)
npm test
# Tests: src/utils/*.test.ts
# Excludes: e2e tests (configured in vite.config.ts)

# 5. E2E tests (Playwright, requires dev server running)
npm run test:e2e           # Headless mode
npm run test:e2e:ui        # Interactive UI mode
npm run test:e2e:headed    # Headed browser mode
```

### E2E Testing Requirements

- **Prerequisite**: Dev server MUST be running (`npm run dev`) on port 3000
- **Config**: `playwright.config.ts` - baseURL: http://localhost:3000, testDir: ./e2e
- **Test files**: Located in `/e2e/*.spec.ts`
- **CI behavior**: Uses Chromium only, retries failed tests 2x, runs tests serially (workers: 1)
- **Known issue**: Some tests timeout at 30s - this is expected for async operations

## Project Architecture

### Directory Structure

```
/src
  /components     - React UI components (AddEntry, TaskList, TaskListRow, Summary, DateField)
  /models         - TypeScript types (Task.ts, Project.ts, Comment.ts)
  /routes         - TanStack Router routes (__root.tsx, index.tsx)
  /utils          - Utility functions (time.ts, filters.ts) with tests
  db.ts           - Dexie IndexedDB configuration
  store.ts        - Zustand global state store
  validations.ts  - Form validation functions
  router.tsx      - TanStack Router setup
  routeTree.gen.ts - AUTO-GENERATED (don't edit)
  version.ts      - App version constant

/e2e              - Playwright E2E tests
/public           - Static assets
```

### State Management (Zustand + IndexedDB)

- **Store file**: `src/store.ts`
- **Database**: `src/db.ts` (Dexie - IndexedDB wrapper)
- **Collections**: tasks, projects, comments
- **Critical**: `loadFromIndexedDb()` MUST be called on app init (see `__root.tsx` useEffect)
- **Pattern**: All mutations write to IndexedDB then update Zustand state
- **DevTools**: Enabled only in development (NODE_ENV === 'development')

### Data Models

```typescript
Task:    { id, date, timeStart, timeEnd?, project, comment? }
Project: { id, name }
Comment: { id, project, comment }
```

### Key Components

1. **TaskList** - Displays tasks in a table, filters by date range, handles incomplete task logic
2. **AddEntry** - Form to add new tasks (only shows when no incomplete tasks exist)
3. **TaskListRow** - Editable task row with update/stop functionality
4. **Summary** - Shows date picker and aggregated project time totals
5. **DateField** - Reusable date picker with presets (Today/Yesterday/Tomorrow)

### Testing Patterns

- **Unit tests**: Use Vitest, located alongside source files (\*.test.ts)
- **E2E tests**: Use `data-testid` attributes for element selection:
  - `add-entry-input-start-time`
  - `add-entry-input-end-time`
  - `add-entry-input-project`
  - `add-entry-input-comment`
  - `button-add-task`
- **E2E best practice**: Always check if add button is visible and complete incomplete tasks in beforeEach

## Configuration Files

### TypeScript (`tsconfig.json`)

- jsx: "react-jsx"
- moduleResolution: "Bundler"
- strictNullChecks: true
- No path aliases configured (use relative imports)

### Vite (`vite.config.ts`)

- Port: 3000
- Plugins: vite-tsconfig-paths, @tanstack/react-start (Netlify target), @vitejs/plugin-react
- Test exclusion: e2e directory excluded from Vitest

### Prettier (`.prettierrc`)

- Empty config = uses Prettier defaults

### Playwright (`playwright.config.ts`)

- Single browser: Chromium (Desktop Chrome)
- Parallel execution in local, serial in CI
- Retries: 0 local, 2 in CI

## Common Gotchas & Workarounds

### 1. IndexedDB Initialization

**Issue**: State is empty on app load
**Fix**: Ensure `loadFromIndexedDb()` is called in root component useEffect (already implemented in `__root.tsx`)

### 2. SSR Configuration

**Issue**: localStorage/IndexedDB errors during build
**Fix**: All routes must have `ssr: false` (see `routes/index.tsx`)

### 3. Incomplete Task Logic

**Issue**: Add button not visible
**Reason**: By design - only one incomplete task allowed (task without timeEnd)
**Test pattern**: Always complete incomplete tasks in E2E test setup

### 4. Autocomplete Strict Mode

**Issue**: Playwright "strict mode violation" on `.mantine-Autocomplete-option`
**Fix**: Use `.first()` or filter with more specific selectors to get single element

### 5. Date Picker Testing

**Issue**: Multiple popover dropdowns on page
**Fix**: Filter by child elements: `.locator(".mantine-Popover-dropdown").filter({ has: page.locator(".mantine-DatePickerInput-day") })`

### 6. Build Output

- Client bundle: `.tanstack/start/build/client-dist/`
- Server bundle: `.netlify/functions-internal/`
- Don't commit these directories (in .gitignore)

## Validation & CI

### Pre-commit Checks

No automated pre-commit hooks configured. Manually verify:

1. `npm run build` - succeeds without errors
2. `npm test` - all unit tests pass
3. `npm run test:e2e` - E2E tests pass (dev server must be running)
4. TypeScript compiles without errors

### Making Changes

1. **Component changes**: Add/update data-testid attributes for testability
2. **Store changes**: Update `loadFromIndexedDb()` when adding new collections
3. **Route changes**: Always set `ssr: false` in route config
4. **Form changes**: Update validation functions in `src/validations.ts`
5. **Test changes**: Follow existing patterns, use proper async/await for IndexedDB operations

## Key File Contents

### `package.json` scripts

- dev: "vite dev"
- build: "vite build"
- test: "vitest"
- test:e2e: "playwright test"

### Root files

- `.nvmrc` - Node version (lts/\*)
- `README.md` - Minimal description, Netlify badge
- `vite.config.ts` - Vite + TanStack Start + Netlify configuration
- `tsconfig.json` - TypeScript compiler options
- `playwright.config.ts` - E2E test configuration

### Database Schema (Dexie)

Version 1: tasks, projects tables
Version 2: Added comments table
Auto-increment IDs, indexed fields for queries

## Instructions for Agent

**Trust these instructions.** Only search for additional information if:

1. Instructions are incomplete or ambiguous
2. You encounter errors not documented here
3. You need to understand implementation details beyond architecture

When in doubt, follow existing code patterns in the repository.
