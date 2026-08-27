# AGENTS.md

This file provides unified guidance for AI assistants working with this repository, designed to be useful for both Claude Code and Microsoft Copilot.

## Project Overview

Effortum is a time tracking application that stores data only in Local Storage using IndexedDB through Dexie.js. It's built with:

- TanStack Start with Nitro for the framework
- React 19 and TypeScript
- Mantine UI components
- Zustand for state management
- Dexie.js for IndexedDB database operations

## Architecture

The application follows a structured pattern:

1. **Database Layer**: `src/db.ts` contains the EffortumDB class that extends Dexie, managing tasks, projects, overtime data, and settings with versioned
   migrations.

2. **State Management**: `src/store.ts` uses Zustand with devtools for global state management, synchronizing with IndexedDB through the database layer.

3. **Routing**: Uses TanStack Router with generated route tree (`routeTree.gen.ts`) for navigation.

4. **UI Components**: Located in `src/components/` directory, organized by functionality.

5. **Pages**: Located in `src/pages/` directory, representing different views of the application.

## Key Files and Concepts

### Core Data Models

- `Task`: Represents time tracking entries with date, start/end times, project ID, and comment
- `Project`: Represents projects that tasks are associated with
- `Overtime`: Manages overtime balance and working hours per day
- `Settings`: Stores application settings like rounding preferences

### Database Structure

The database uses Dexie.js with versioned migrations to maintain backward compatibility. Key tables:

- `tasks`: Stores time tracking entries with foreign key to projects
- `projects`: Stores project names with unique IDs
- `overtime`: Stores overtime balance information
- `settings`: Stores user preferences

### State Management

The store (`useEffortumStore`) manages:

- Tasks, projects, overtime data, and settings
- Loading data from IndexedDB on app start
- Adding/updating tasks and projects
- Handling project name updates with denormalized data synchronization

## Development Commands

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Run end-to-end tests
pnpm test:e2e

# Run tests in watch mode
pnpm test:watch
```

### Testing

- Unit tests: `vitest` framework
- End-to-end tests: `playwright`
- Test files are located alongside components with `.test.ts` suffix

### Code Quality

The project uses:

- TypeScript for type safety
- Prettier for code formatting
- ESLint (configured through tsconfig and Vite)

## Development Workflow

1. **Start Development Server**: Run `pnpm dev` to start the development server on port 3000.

2. **Making Changes**:
   - UI components are in `src/components/`
   - Page layouts are in `src/pages/`
   - Data logic is in `src/store.ts` and `src/db.ts`

3. **Database Migrations**: When adding new database fields or tables, create new versioned migrations in `src/db.ts`.

4. **State Updates**: Use the Zustand store for global state management with proper async operations.

5. **Testing**: Write unit tests for components and integration tests for data flows and ensure all tests are green.

## Architecture Documentation

The architecture documentation in `docs/architecture.md` must always be kept up-to-date whenever architecture-relevant changes are made to the codebase. This
includes:

- Changes to core data models
- Modifications to database schema or migrations
- Updates to state management patterns
- Changes to routing structure
- Modifications to component architecture

When making any change that affects the overall system design, ensure that `docs/architecture.md` is updated accordingly to reflect the current implementation.

## Code Formatting

All files must be formatted with Prettier except for:

- Table structures in Markdown files
- Mermaid diagrams in Markdown files

Prettier formatting should be applied automatically during development and before committing changes. The project includes a `.prettierrc` configuration file
that defines the formatting rules to be followed.

## Key Areas to Understand

- **Data Flow**: How data moves from UI components → Zustand store → Dexie database
- **Database Migrations**: Understanding how versioned migrations work in `src/db.ts`
- **Project Relationships**: How tasks relate to projects with proper denormalization and backfilling logic
- **Time Management**: Handling time tracking calculations, rounding, and validation

## Special Considerations for AI Assistants

When working on this codebase:

1. Follow the existing patterns and conventions throughout the codebase
2. Maintain consistency with established naming conventions and component structures
3. Respect the separation of concerns between UI components, data logic, and state management
4. Understand that all data is persisted locally using IndexedDB through Dexie.js
5. Be aware that this is a single-page application built with TanStack Start and React 19
6. Consider that the project uses Mantine UI components for consistent styling
