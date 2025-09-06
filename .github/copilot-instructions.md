# Effortum - Copilot Instructions

## Repository Overview

**Effortum** is a React-based time tracking application that stores all data locally in the browser's IndexedDB. It's a single-page application (SPA) with server-side rendering (SSR) capabilities deployed to Netlify.

- **Type**: React TypeScript web application
- **Purpose**: Local time tracker with project-based task management
- **Size**: ~94 source files (excluding node_modules)
- **Architecture**: React 19 + TanStack Router/Start + Mantine UI + Dexie DB + Zustand state management

## Technology Stack

- **Frontend**: React 19.1.0, TypeScript 5.8.3
- **Routing/SSR**: TanStack Router/Start 1.127.x
- **UI Framework**: Mantine 8.1.3 (with charts, dates, notifications)
- **Database**: Dexie 4.0.11 (IndexedDB wrapper for local storage)
- **State Management**: Zustand 5.0.7
- **Date Library**: Day.js 1.11.13
- **Build Tool**: Vite 7.0.4 with TanStack Start Netlify preset
- **Testing**: Vitest 3.2.4 (unit tests), Playwright 1.54.2 (e2e tests)
- **Node Version**: LTS/* (specified in `.nvmrc`)

## Build Instructions

### Prerequisites
Always ensure you're using the correct Node.js version:
```bash
# Use Node LTS version as specified in .nvmrc
nvm use
```

### Bootstrap & Dependencies
**ALWAYS run `npm install` before any other commands.**
```bash
npm install
```
- Takes approximately 30 seconds
- Downloads ~805 packages
- No post-install scripts that require interaction

### Build Process
```bash
npm run build
```
- **Duration**: ~7 seconds
- **Output**: `.tanstack/start/build/` and `.netlify/functions-internal/`
- **Target**: Netlify deployment with SSR support
- **Success indicators**: 
  - Client bundle created in `.tanstack/start/build/client-dist/`
  - Server bundle created in `.netlify/functions-internal/server/`
  - No build errors or TypeScript compilation issues

### Development Server
```bash
npm run dev
```
- **Default port**: 3000 (auto-increments if occupied)
- **Access**: `http://localhost:3000/` (or whatever port is shown)
- **Features**: Hot reload, route generation
- **Ready when**: "VITE ready" message appears with local URL

### Testing

#### Unit Tests
```bash
npm run test
```
- **Tool**: Vitest
- **Location**: `src/utils/*.test.ts`
- **Current status**: 1 known failing test in `filters.test.ts` (date format handling)
- **Expected**: ~15 passing tests, 1 failing test is acceptable
- **Duration**: <1 second

#### E2E Tests  
**IMPORTANT**: E2E tests require browser installation first:
```bash
npx playwright install
npm run test:e2e
```
- **Tool**: Playwright
- **Location**: `e2e/*.spec.ts`
- **Browser**: Chromium (headless)
- **Current status**: Tests fail without browser installation
- **Duration**: ~30 seconds after browser installation
- **Additional commands**:
  - `npm run test:e2e:ui` - Run with Playwright UI
  - `npm run test:e2e:headed` - Run with visible browser

### Known Issues & Workarounds

1. **Playwright Browser Installation**: E2E tests will fail with "Executable doesn't exist" if browsers aren't installed. Always run `npx playwright install` first.

2. **E2E Tests in Vitest**: The `e2e/` directory gets picked up by `npm run test`. This is expected behavior - the e2e files error out when run with vitest but don't affect unit test results.

3. **Port Conflicts**: Dev server automatically finds available port if 3000 is busy.

4. **One Failing Unit Test**: `src/utils/filters.test.ts` has one failing test related to date format handling. This is a known issue and doesn't indicate problems with your changes.

## Project Layout & Architecture

### Directory Structure
```
src/
├── components/          # React UI components
│   ├── AddEntry.tsx     # Task creation form
│   ├── DateField.tsx    # Date picker component
│   ├── Summary.tsx      # Time tracking summary
│   ├── TaskList.tsx     # Main task list view
│   └── TaskListRow.tsx  # Individual task row
├── models/              # TypeScript type definitions
│   ├── Task.ts          # Task type (id, date, times, project, comment)
│   └── Project.ts       # Project type (id, name)
├── routes/              # TanStack Router pages
│   ├── __root.tsx       # Root layout with Mantine provider
│   └── index.tsx        # Main page (Grid with TaskList + Summary)
├── utils/               # Utility functions
│   ├── time.ts          # Duration calculations and formatting
│   ├── filters.ts       # Task filtering by date range
│   └── *.test.ts        # Unit tests
├── db.ts               # Dexie database setup (tasks + projects tables)
├── store.ts            # Zustand store (tasks, projects, date range state)
├── router.tsx          # Router configuration and type registration
├── validations.ts      # Form validation functions
├── version.ts          # Manual version tracking
└── routeTree.gen.ts    # Auto-generated route tree (don't edit)
```

### Configuration Files
- `vite.config.ts` - Vite build config with TanStack Start + Netlify preset
- `tsconfig.json` - Basic TypeScript configuration
- `playwright.config.ts` - E2E test configuration (base URL: localhost:3000)
- `.prettierrc` - Empty file (uses Prettier defaults)
- `.nvmrc` - Node version specification (LTS/*)
- `package.json` - Scripts and dependencies

### Key Data Models

**Task**:
```typescript
type Task = {
  id: string;           // UUID
  date: string;         // ISO date string (YYYY-MM-DD)
  timeStart: string;    // ISO time string (HH:mm)
  timeEnd?: string;     // Optional ISO time string
  project: string;      // Project name
  comment?: string;     // Optional description
};
```

**Project**:
```typescript
type Project = {
  id: string;          // UUID
  name: string;        // Unique project name
};
```

### State Management
The app uses Zustand (`src/store.ts`) with the following key state:
- `tasks: Task[]` - All tasks from IndexedDB
- `projects: Project[]` - All projects from IndexedDB  
- `selectedDateRange: [string | null, string | null]` - Date filter
- `endTimeOfLastStoppedTask: string | null` - For continuous tracking

### Database (IndexedDB via Dexie)
- **Database name**: "EffortumDatabase"
- **Tables**: 
  - `tasks` - indexed by id, date, timeStart, timeEnd, project
  - `projects` - indexed by id, name (unique)
- **Storage**: All data stored locally in browser

### Validation Pipeline
No automated linting or CI/CD is configured. Manual validation includes:
1. TypeScript compilation (via `npm run build`)
2. Unit tests (via `npm run test`)
3. E2E tests (via `npm run test:e2e`)
4. Manual testing of UI components

## Development Guidelines

### Making Changes
1. **Always run tests first**: `npm run test` to understand baseline
2. **Install dependencies**: `npm install` if package.json changes
3. **Test incrementally**: Run `npm run build` after making changes
4. **Use test IDs**: Components use `data-testid` attributes for testing
5. **Follow existing patterns**: Check existing components for code style

### Testing Your Changes
1. **Unit tests**: If modifying `src/utils/`, run `npm run test`
2. **E2E tests**: If modifying UI, install browsers and run `npm run test:e2e`
3. **Manual testing**: Start dev server (`npm run dev`) and verify functionality
4. **Build verification**: Run `npm run build` to ensure no TypeScript errors

### Common Patterns
- **Components**: Use Mantine UI library components exclusively
- **State updates**: Use Zustand store methods (addTask, updateTask, etc.)
- **Date handling**: Use Day.js for all date operations
- **Form validation**: Use functions from `src/validations.ts`
- **Test data IDs**: Use format `data-testid="component-action-field"`

### File Locations for Common Tasks
- **UI components**: `src/components/`
- **Type definitions**: `src/models/`
- **Business logic**: `src/utils/`
- **Form validation**: `src/validations.ts`
- **Database operations**: `src/store.ts` (uses `src/db.ts`)
- **Routing**: `src/routes/`
- **Tests**: Co-located `*.test.ts` files

## Trust These Instructions

These instructions are comprehensive and tested. Only search for additional information if:
1. The instructions are incomplete for your specific task
2. You encounter errors not documented here
3. The repository structure has changed significantly

When in doubt, refer to the working commands and file locations documented above rather than exploring extensively.