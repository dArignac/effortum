# Tasks: Issue #264

- [x] Task 1: Add `ProjectBudget` model, Dexie `version(8)` migration, and invariant guard update
  - Description: Create `src/models/ProjectBudget.ts`, add `budgets` table in `src/db.ts` via `this.version(8)`, update `FROZEN_DEXIE_VERSIONS` in
    `scripts/check-invariants.ts` and `scripts/check-invariants.test.ts`, and include `budgets` in `src/components/ImportData.tsx`.
  - Acceptance: `EffortumDB` defines `budgets` in `version(8)` without altering `version(1)..version(7)`, and invariant checks pass.
  - Verify: `pnpm test scripts/check-invariants.test.ts`
  - Files: `src/models/ProjectBudget.ts`, `src/db.ts`, `scripts/check-invariants.ts`, `scripts/check-invariants.test.ts`, `src/components/ImportData.tsx`

- [x] Task 2: Implement budget sorting and metrics formatting utilities
  - Description: Create `src/utils/budget.ts` and `src/utils/budget.test.ts` with `sortProjectBudgetsNewestFirst`, `formatBudgetMetricNumber`, and
    `formatBudgetMetrics` to compute spent/budgeted hours, days in brackets `(X/Y days)`, and depletion percentage (`Z%`).
  - Acceptance: Unit tests verify newest-first sorting by `startDate`, clean number formatting (e.g. `(4.5/11 days)`), and depletion percentage calculation
    (e.g. `75%` for 75h of 100h).
  - Verify: `pnpm test src/utils/budget.test.ts`
  - Files: `src/utils/budget.ts`, `src/utils/budget.test.ts`

- [x] Task 3: Add `budgetSlice` to Zustand store and integrate with startup loading and project deletion
  - Description: Add `budgetSlice.ts` (`addProjectBudget`, `updateProjectBudget`, `deleteProjectBudget`, `getProjectBookedTimeHoursInRange`), wire it into
    `src/store/types.ts`, `src/store/index.ts`, `src/store/slices/loadingMigrationSlice.ts`, and update `deleteProject` in `src/store/slices/projectSlice.ts` to
    delete or move project budgets.
  - Acceptance: Unit tests in `src/store/slices/budgetSlice.test.ts` and `src/store/slices/projectSlice.test.ts` pass, verifying CRUD validation (including max
    50 chars purpose), date-range hour summation, and project deletion budget cleanup/migration.
  - Verify: `pnpm test src/store/slices/budgetSlice.test.ts src/store/slices/projectSlice.test.ts`
  - Files: `src/store/types.ts`, `src/store/index.ts`, `src/store/slices/budgetSlice.ts`, `src/store/slices/budgetSlice.test.ts`,
    `src/store/slices/loadingMigrationSlice.ts`, `src/store/slices/projectSlice.ts`, `src/store/slices/projectSlice.test.ts`

- [x] Task 4: Build `BudgetsPage` and add `Budgets` sidebar navigation item
  - Description: Create `src/pages/BudgetsPage.tsx` supporting project selection, adding budgets (start date, end date, purpose max 50 chars, hours),
    newest-first budget list, per-row metrics (`spent/budgeted h (X/Y days) · Z%`), inline editing (`Save`), and removal (`Delete`). Register `Budgets`
    (`nav-budgets`) in `src/routes/index.tsx`.
  - Acceptance: TypeScript compilation and architectural invariants pass with zero errors.
  - Verify: `pnpm tsc --noEmit`
  - Files: `src/pages/BudgetsPage.tsx`, `src/routes/index.tsx`

- [x] Task 5: Add Playwright E2E tests and update architecture documentation
  - Description: Create `e2e/issue-264.spec.ts` testing end-to-end budget creation, newest-first sorting, spent vs. budgeted hours/days/percent display, editing
    a budget, and deleting a budget. Update `docs/architecture.md`.
  - Acceptance: Playwright E2E test suite `e2e/issue-264.spec.ts` passes headless and `docs/architecture.md` reflects the new `PROJECT_BUDGET` table,
    `budgetSlice`, and `BudgetsPage`.
  - Verify: `pnpm test:e2e e2e/issue-264.spec.ts`
  - Files: `e2e/issue-264.spec.ts`, `docs/architecture.md`

- [x] Task 6: Remove overall project budget line and add delete confirmation modal in `BudgetsPage`
  - Description: In `src/pages/BudgetsPage.tsx`, remove the `Overall Project Budget` summary box (`project-budget-overall-summary`) and unused overall
    spent/budgeted state, and add a Mantine `<Modal>` (`data-testid="modal-delete-budget"`) triggered when clicking `Delete` (`button-delete-budget-<id>`) with
    `Cancel` (`data-testid="button-cancel-delete-budget"`) and `Delete Budget` (`button-confirm-delete-budget`) buttons.
  - Acceptance: `project-budget-overall-summary` is no longer rendered, clicking `Delete` opens `modal-delete-budget`, and `pnpm tsc --noEmit` and
    `pnpm check:invariants` pass.
  - Verify: `pnpm tsc --noEmit`
  - Files: `src/pages/BudgetsPage.tsx`

- [x] Task 7: Update Playwright E2E test and architecture documentation for delete confirmation and removed overall budget line
  - Description: Update `e2e/issue-264.spec.ts` to assert that `project-budget-overall-summary` is not present and to verify canceling and confirming budget
    deletion via `modal-delete-budget`. Update `docs/architecture.md` to reflect per-budget metrics and delete confirmation.
  - Acceptance: `pnpm test:e2e e2e/issue-264.spec.ts` passes headless.
  - Verify: `pnpm test:e2e e2e/issue-264.spec.ts`
  - Files: `e2e/issue-264.spec.ts`, `docs/architecture.md`

- [x] Task 8: Enforce maximum budget hours (`17520`) and uniform column widths in `BudgetsPage`
  - Description: Export `MAX_BUDGET_HOURS = 17520` in `src/utils/budget.ts`, validate `hours <= MAX_BUDGET_HOURS` (`BUDGET_HOURS_TOO_HIGH`) in
    `src/store/slices/budgetSlice.ts` with unit tests in `src/store/slices/budgetSlice.test.ts`, and update `src/pages/BudgetsPage.tsx` to enforce
    `MAX_BUDGET_HOURS` and apply fixed flex column widths (`startDate`, `endDate`, `hours`, `budget-metrics-<id>`, `Save`, `Delete` with `flex: "0 0 ..."` and
    `purpose` with `flex: "1 1 0", minWidth: 0`) so all columns have identical widths across rows regardless of budget size.
  - Acceptance: Unit tests in `src/store/slices/budgetSlice.test.ts` and `pnpm tsc --noEmit` pass.
  - Verify: `pnpm test src/store/slices/budgetSlice.test.ts`
  - Files: `src/utils/budget.ts`, `src/store/slices/budgetSlice.ts`, `src/store/slices/budgetSlice.test.ts`, `src/pages/BudgetsPage.tsx`

- [x] Task 9: Verify uniform column widths and max budget hours in E2E tests and update architecture docs
  - Description: Update `e2e/issue-264.spec.ts` to verify that budget rows with different budget sizes (e.g. `8` vs `17520` hours) have identical column widths
    across all columns (`startDate`, `endDate`, `purpose`, `hours`, `metrics`, `Save`, `Delete`) and that budgets `> 17520` hours are rejected. Update
    `docs/architecture.md`.
  - Acceptance: `pnpm test:e2e e2e/issue-264.spec.ts` passes headless.
  - Verify: `pnpm test:e2e e2e/issue-264.spec.ts`
  - Files: `e2e/issue-264.spec.ts`, `docs/architecture.md`
