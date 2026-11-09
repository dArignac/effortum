# Spec: Add Project Budget Persistence and Dedicated Budget Management Page (#264)

## Objective

Parent issue: #258 (Part 1).

Enable users to define and manage time-bounded budgets for projects so they can track how much of each project's budget and overall project budget has been
spent.

### Acceptance Criteria

1. **Multiple Budgets per Project:**
   - Each budget belongs to a project (`projectId`) and stores a `startDate` (`YYYY-MM-DD`), `endDate` (`YYYY-MM-DD`), `purpose` (max. 50 characters), and
     budgeted `hours` (`> 0`).
2. **Persistence & State Management:**
   - Budgets are persisted in IndexedDB via a new Dexie `version(8)` table (`budgets`) and managed through the Zustand store (`budgetSlice`).
   - Budgets are loaded on application startup in `loadFromIndexedDb`.
   - When deleting a project in `deleteProject`:
     - If tasks are deleted (or the project has zero tasks), all budgets belonging to that project are deleted.
     - If tasks are moved to a destination project, all budgets belonging to the source project are moved to the destination project.
3. **Dedicated Budget Management Page (`BudgetsPage`):**
   - Accessible via a top-level `Budgets` item (`data-testid="nav-budgets"`) in the sidebar navigation.
   - Displays a searchable, clearable project selector dropdown (`data-testid="budget-project-select"`), ordered alphabetically.
   - Allows adding a new budget for the selected project with `startDate`, `endDate`, `purpose` (max 50 characters), and `hours`.
   - Allows changing any existing budget (`startDate`, `endDate`, `purpose`, `hours`) at any time via per-row `Save`.
   - Allows removing any existing budget at any time via per-row `Delete`.
   - Sorts the project's budgets by their `startDate`, newest first (descending).
   - Displays spent hours vs. budgeted hours, with amounts in days in brackets using `workingHoursPerDay` from Overtime settings (default `8`), and depletion in
     percent (`X%`):
     - **Overall project summary** at the top (`data-testid="project-budget-overall-summary"`): total booked hours on the project vs. total budgeted hours
       across all budgets for the project, e.g. `75/100 h (9.38/12.5 days) · 75%`.
     - **Per-budget row metrics** (`data-testid="budget-metrics-<id>"`): booked hours on the project within that budget's `[startDate, endDate]` range vs. that
       budget's hours, e.g. `36/88 h (4.5/11 days) · 41%`.

## Tech Stack

- TypeScript
- React 19 + TanStack Start
- Mantine UI (`@mantine/core`, `@mantine/dates`, `@mantine/notifications`)
- Zustand (`src/store`)
- Dexie.js (`src/db.ts`)
- Dayjs (`dayjs`)

## Commands

- Run checks: `pnpm check:invariants`
- Run unit tests: `pnpm test`
- Run E2E tests: `pnpm test:e2e`
- Typecheck: `pnpm tsc --noEmit`

## Project Structure

- `src/models/ProjectBudget.ts` (new): `ProjectBudget` domain model type.
- `src/db.ts` (modified): Add `budgets!: Table<ProjectBudget>` and `this.version(8)` schema definition.
- `scripts/check-invariants.ts` & `scripts/check-invariants.test.ts` (modified): Add `8` to `FROZEN_DEXIE_VERSIONS`.
- `src/utils/budget.ts` & `src/utils/budget.test.ts` (new): Pure helpers for sorting budgets newest-first and formatting spent/budgeted hours, days in brackets,
  and depletion percentage.
- `src/store/types.ts` (modified): Add `ProjectBudgetInput`, `ProjectBudgetUpdateInput`, and budget store state/actions to `EffortumStore`.
- `src/store/slices/budgetSlice.ts` & `src/store/slices/budgetSlice.test.ts` (new): Budget CRUD actions and date-range booked hours query.
- `src/store/slices/loadingMigrationSlice.ts` (modified): Load `budgets` on startup.
- `src/store/slices/projectSlice.ts` & `src/store/slices/projectSlice.test.ts` (modified): Delete or move project budgets when deleting a project.
- `src/store/index.ts` (modified): Compose `createBudgetSlice` into `storeCreator`.
- `src/components/ImportData.tsx` (modified): Include `budgets` table in database clear/fallback import.
- `src/pages/BudgetsPage.tsx` (new): Dedicated Budget Management page component.
- `src/routes/index.tsx` (modified): Add `Budgets` navigation item (`nav-budgets`).
- `e2e/issue-264.spec.ts` (new): End-to-end Playwright verification of project budget management.
- `docs/architecture.md` (modified): Document `PROJECT_BUDGET` entity, `budgetSlice`, and `BudgetsPage`.

## Effortum Architectural Guard

- **Dexie Schema Migration:** Yes — appends `this.version(8)` in `src/db.ts` with `budgets: "&id, projectId, startDate, endDate, purpose, hours"` while keeping
  versions `1..7` untouched, and updates `FROZEN_DEXIE_VERSIONS` in `scripts/check-invariants.ts`.
- **Store Slice Boundaries:** Adds `src/store/slices/budgetSlice.ts` and updates `loadingMigrationSlice.ts` and `projectSlice.ts`. `BudgetsPage.tsx` accesses
  data strictly via `useEffortumStore`.
- **Date & Time Operations:** All date validation, comparisons, and range filtering use `dayjs` (`normalizeDate`). No raw `new Date()`.
- **Single Running Task Invariant:** Untouched; task start/stop behavior is not modified, and only completed tasks (`Boolean(task.timeEnd)`) count toward spent
  hours.
- **Testing Requirements:** Unit tests in `src/utils/budget.test.ts`, `src/store/slices/budgetSlice.test.ts`, `src/store/slices/projectSlice.test.ts`,
  `scripts/check-invariants.test.ts`, and Playwright E2E tests in `e2e/issue-264.spec.ts`.

## Boundaries

- Always: Run `pnpm check:invariants`, write tests alongside code, format with Prettier.
- Ask first: Schema changes beyond `version(8)`, new dependencies, deleting existing tests.
- Never: Direct Dexie imports in UI, naked `new Date()`, `@ts-ignore`, `test.skip`.

## Success Criteria

- Users can navigate to `Budgets` via the sidebar (`nav-budgets`), select a project, and add multiple budgets with start date, end date, purpose (max 50 chars),
  and hours.
- Existing budgets are sorted by `startDate` descending (newest first) and can be edited and saved or deleted at any time.
- Both the overall project budget summary and each budget row display spent vs. budgeted hours, days in brackets `(X/Y days)` based on `workingHoursPerDay`, and
  depletion percentage (`Z%`).
- Deleting a project deletes or moves its budgets matching the selected task action.
- `pnpm check:invariants`, `pnpm tsc --noEmit`, `pnpm test`, and `pnpm test:e2e e2e/issue-264.spec.ts` all pass with zero errors.
