# Architectural Audit Report: Issue #264 — Project Budget Persistence and Dedicated Budget Management Page

**Status:** AUDIT PASSED

## 1. Deterministic Verification Summary

| Check                    | Command                                | Exit Code | Result                                                                                                            |
| ------------------------ | -------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------- |
| Architectural Invariants | `pnpm check:invariants`                | `0`       | Passed (`no-direct-dexie-in-ui`, `enforce-dayjs`, `dexie-migration-immutability`, `no-suppressed-tests-or-types`) |
| Unit Tests               | `pnpm test`                            | `0`       | Passed (14 test files, 125 tests)                                                                                 |
| Issue #264 E2E Tests     | `pnpm test:e2e e2e/issue-264.spec.ts`  | `0`       | Passed (1 test)                                                                                                   |
| Navigation E2E Tests     | `pnpm test:e2e e2e/navigation.spec.ts` | `0`       | Passed (5 tests)                                                                                                  |
| TypeScript Typecheck     | `pnpm tsc --noEmit`                    | `0`       | Passed (0 errors)                                                                                                 |
| Code Formatting          | `pnpm prettier --check .`              | `0`       | Passed                                                                                                            |

## 2. Architectural Invariant & Boundary Audit

1. **Persistence & Dexie Migration Immutability (`src/db.ts`, `scripts/check-invariants.ts`, `scripts/check-invariants.test.ts`):**
   - Verified `src/db.ts` appends `this.version(8)` defining `budgets: "&id, projectId, startDate, endDate, purpose, hours"` without modifying historical schema
     blocks `version(1)` through `version(7)`.
   - Verified `FROZEN_DEXIE_VERSIONS` in `scripts/check-invariants.ts` was updated to `[1, 2, 3, 4, 5, 6, 7, 8]` and verified by
     `scripts/check-invariants.test.ts`.
   - Verified `src/components/ImportData.tsx` includes `db.budgets` in database count logging, table clearing, and fallback import.

2. **UI Layer, Max Hours Enforcement, Uniform Column Widths, Delete Confirmation Modal & State Store Boundaries (`src/pages/BudgetsPage.tsx`,
   `src/routes/index.tsx`, `src/utils/budget.ts`, `src/store/slices/budgetSlice.ts`, `src/store/slices/projectSlice.ts`,
   `src/store/slices/loadingMigrationSlice.ts`):**
   - Verified `src/pages/BudgetsPage.tsx` and `src/routes/index.tsx` access state and actions exclusively through `useEffortumStore` without importing `dexie`
     or `src/db` directly.
   - Verified `MAX_BUDGET_HOURS = 17520` (2 years) is exported from `src/utils/budget.ts`, enforced in `src/store/slices/budgetSlice.ts`
     (`BUDGET_HOURS_TOO_HIGH`), and enforced in `src/pages/BudgetsPage.tsx` (`canSaveBudgetDraft`, `getBudgetErrorMessage`, and `NumberInput`).
   - Verified `src/pages/BudgetsPage.tsx` enforces uniform column widths across all budget rows (`startDate`, `endDate`, `purpose`, `hours`,
     `budget-metrics-<id>`, `Save`, and `Delete`) regardless of budget hours or metric string length, and does not render an overall project budget summary
     (`project-budget-overall-summary` removed).
   - Verified budget deletion in `src/pages/BudgetsPage.tsx` is guarded by a Mantine confirmation `<Modal>` (`data-testid="modal-delete-budget"`) with `Cancel`
     (`data-testid="button-cancel-delete-budget"`) and `Delete Budget` (`data-testid="button-confirm-delete-budget"`) actions.
   - Verified `loadFromIndexedDb` loads `budgets` on startup and `deleteProject` deletes or moves project budgets alongside project tasks.

3. **Date & Time Operations (`src/store/slices/budgetSlice.ts`, `src/pages/BudgetsPage.tsx`):**
   - Verified all date normalization, validation, and task duration calculations use `dayjs` and `normalizeDate` (`src/utils/date.ts`). No raw `new Date()`
     calls were introduced.

4. **Test Integrity & Coverage (`src/utils/budget.test.ts`, `src/store/slices/budgetSlice.test.ts`, `src/store/slices/projectSlice.test.ts`,
   `e2e/issue-264.spec.ts`):**
   - Verified no existing tests were deleted, skipped, or had assertions weakened.
   - Verified unit tests cover newest-first budget sorting, metric formatting (`spent/budgeted h (X/Y days) · Z%`), store slice CRUD validation (including max
     50-character `purpose` and `0 < hours <= 17520`), date-range task hour summation, and project deletion budget cleanup/migration.
   - Verified E2E test `e2e/issue-264.spec.ts` covers rejecting `> 17520` hours on add and edit, adding multiple budgets (`17520h` and `16h`), newest-first
     sorting, uniform column widths across rows of different budget sizes, absence of the overall budget summary line, per-budget metrics, editing, persistence
     across reload, and budget deletion via the confirmation modal (testing both cancel and confirm flows).

5. **Architecture Synchronization (`docs/architecture.md`):**
   - Verified `docs/architecture.md` is updated with the `PROJECT_BUDGET` entity in the ER diagram, `budgetSlice` in the state layer, `BudgetsPage` in the UI
     layer, and `0 < hours <= 17520`, uniform column widths, per-budget metrics, and confirmation-guarded deletion in Key Constraints.
