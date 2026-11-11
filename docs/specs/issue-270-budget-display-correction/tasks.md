# Tasks: Issue #270

- [x] Task 1: Pure Budget Spent Calculation Utility & Unit Tests
  - Description: Implement `calculateOverlappingBudgetSpentHours` in `src/utils/budget.ts` which calculates cumulative spent hours for each overlapping budget
    from `budget.startDate` to `min(budget.endDate, rangeEnd)`. Cover all scenarios and examples from issue #270 in `src/utils/budget.test.ts`.
  - Acceptance: All unit tests in `src/utils/budget.test.ts` pass, including issue #270 examples (01.10.26-01.10.26, 20.09.26-31.12.26, 15.09.26-10.10.26).
  - Verify: `pnpm test src/utils/budget.test.ts`
  - Files: `src/utils/budget.ts`, `src/utils/budget.test.ts`

- [x] Task 2: Store Method `getProjectBudgetSpentHours` & Store Tests
  - Description: Add `getProjectBudgetSpentHours(projectId: string, selectedDateRange: [string | null, string | null]): Promise<number>` to `budgetSlice` in
    `src/store/slices/budgetSlice.ts`, update `src/store/types.ts`, and test in `src/store/slices/budgetSlice.test.ts`.
  - Acceptance: Store method accurately queries project tasks from Dexie and computes spent hours; unit tests in `src/store/slices/budgetSlice.test.ts` pass.
  - Verify: `pnpm test src/store/slices/budgetSlice.test.ts && pnpm tsc --noEmit`
  - Files: `src/store/slices/budgetSlice.ts`, `src/store/types.ts`, `src/store/slices/budgetSlice.test.ts`

- [x] Task 3: Summary Panel Integration for Cumulative Budget Depletion
  - Description: Update `src/components/Summary.tsx` to display budget depletion using cumulative spent hours via `getProjectBudgetSpentHours` (with in-memory
    fallback), updating whenever `selectedDateRange`, `tasks`, or `budgets` change.
  - Acceptance: Project rows display cumulative used budget hours up to the date range end date; passes invariants and typecheck.
  - Verify: `pnpm check:invariants && pnpm tsc --noEmit && pnpm test`
  - Files: `src/components/Summary.tsx`

- [x] Task 4: E2E Tests & Architecture Documentation Sync
  - Description: Add Playwright E2E tests in `e2e/summary-budget-depletion.spec.ts` testing cumulative budget depletion across date ranges. Update
    `docs/architecture.md` with the corrected calculation semantics.
  - Acceptance: All unit and Playwright E2E tests pass, invariants pass, and architecture documentation reflects the changes.
  - Verify: `pnpm check:invariants && pnpm test && pnpm test:e2e e2e/summary-budget-depletion.spec.ts && pnpm prettier --check .`
  - Files: `e2e/summary-budget-depletion.spec.ts`, `docs/architecture.md`
