# Plan: Add Project Budget Persistence and Dedicated Budget Management Page (#264)

## 1. Component Dependency Graph

```mermaid
flowchart TD
  Model["src/models/ProjectBudget.ts"] --> DB["src/db.ts (version 8)"]
  Model --> Utils["src/utils/budget.ts"]
  DB --> Guard["scripts/check-invariants.ts"]
  DB --> Store["src/store/slices/budgetSlice.ts & projectSlice.ts & loadingMigrationSlice.ts"]
  Utils --> Store
  Store --> Page["src/pages/BudgetsPage.tsx"]
  Utils --> Page
  Page --> Route["src/routes/index.tsx"]
  Route --> E2E["e2e/issue-264.spec.ts"]
```

## 2. Implementation Order

1. **Domain Model, Dexie Migration & Invariant Guard:**
   - Create `src/models/ProjectBudget.ts`.
   - Append `this.version(8)` in `src/db.ts` with `budgets: "&id, projectId, startDate, endDate, purpose, hours"`.
   - Update `FROZEN_DEXIE_VERSIONS` in `scripts/check-invariants.ts` and `scripts/check-invariants.test.ts`.
   - Update `src/components/ImportData.tsx` so database clear and fallback import also handle `budgets`.
2. **Budget Utility Functions:**
   - Create `src/utils/budget.ts` and `src/utils/budget.test.ts` for:
     - `sortProjectBudgetsNewestFirst(budgets)`: sorts by `startDate` descending (newest first), then `endDate` descending, then `purpose`.
     - `formatBudgetMetricNumber(value)`: formats numbers up to 2 decimal places without trailing zeroes (e.g. `4.5`, `11`, `100`).
     - `formatBudgetMetrics(spentHours, budgetedHours, workingHoursPerDay)`: formats `<spent>/<budgeted> h (<spentDays>/<budgetedDays> days) · <percent>%` (e.g.
       `36/88 h (4.5/11 days) · 41%`).
3. **Zustand Store Slice & Project Deletion Integration:**
   - Extend `EffortumStore` in `src/store/types.ts` with `budgets`, `addProjectBudget`, `updateProjectBudget`, `deleteProjectBudget`, and
     `getProjectBookedTimeHoursInRange`.
   - Implement `src/store/slices/budgetSlice.ts` and unit tests in `src/store/slices/budgetSlice.test.ts`.
   - Update `src/store/slices/loadingMigrationSlice.ts` to load `budgets` in `loadFromIndexedDb`.
   - Update `src/store/slices/projectSlice.ts` and `src/store/slices/projectSlice.test.ts` so `deleteProject` deletes budgets when tasks are deleted (or project
     has 0 tasks) and moves budgets to `destinationProjectId` when tasks are moved.
   - Register `createBudgetSlice` in `src/store/index.ts`.
4. **Dedicated Budget Management Page & Navigation:**
   - Implement `src/pages/BudgetsPage.tsx` with:
     - Project selector (`data-testid="budget-project-select"`).
     - Overall project budget summary (`data-testid="project-budget-overall-summary"`).
     - Add budget form (`startDate`, `endDate`, `purpose` with `maxLength={50}`, `hours`, and `Add Budget` button).
     - Newest-first sorted list of budget rows with editable `startDate`, `endDate`, `purpose` (`maxLength={50}`), `hours`, per-row spent/budgeted metrics
       (`data-testid="budget-metrics-<id>"`), `Save` button (`data-testid="button-save-budget-<id>"`), and `Delete` button
       (`data-testid="button-delete-budget-<id>"`).
   - Add `Budgets` (`data-testid="nav-budgets"`) to `NAV_ITEMS` in `src/routes/index.tsx`.
5. **End-to-End Verification & Architecture Docs:**
   - Add `e2e/issue-264.spec.ts` covering adding multiple budgets, newest-first sorting, overall and per-budget spent/budgeted hours/days/percent metrics,
     editing budgets, and removing budgets.
   - Update `docs/architecture.md` to document the `PROJECT_BUDGET` table, `budgetSlice`, and `BudgetsPage`.

## 3. Risks and Mitigations

- **Risk:** `FROZEN_DEXIE_VERSIONS` in `scripts/check-invariants.ts` must stay in sync with `src/db.ts`.
  - **Mitigation:** Update `scripts/check-invariants.ts` and `scripts/check-invariants.test.ts` in the same task slice as `src/db.ts`.
- **Risk:** Division by zero when `workingHoursPerDay` is not yet configured or `budgetedHours` is `0`.
  - **Mitigation:** Default `workingHoursPerDay` to `8` when missing or `<= 0`, and use `calculatePercentage` which safely returns `0` when total `<= 0`.
- **Risk:** Tasks booked outside the currently loaded calendar date range might not be in `state.tasks` in memory.
  - **Mitigation:** Query IndexedDB via `getProjectBookedTimeHours` and `getProjectBookedTimeHoursInRange` in the store slice (matching the pattern in
    `ProjectHoursSum` and `TasksPage`).

## 4. Verification Checkpoints

- After Task 1: `pnpm test scripts/check-invariants.test.ts` and `pnpm check:invariants` pass.
- After Task 2: `pnpm test src/utils/budget.test.ts` passes.
- After Task 3: `pnpm test src/store/slices/budgetSlice.test.ts src/store/slices/projectSlice.test.ts` passes.
- After Task 4: `pnpm tsc --noEmit` and `pnpm check:invariants` pass.
- After Task 5: `pnpm test:e2e e2e/issue-264.spec.ts` passes headless.
