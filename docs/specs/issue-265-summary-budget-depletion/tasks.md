# Tasks: Issue #265

- [x] Task 1: Update `formatPercentage` to `X%` without space
  - Description: Change `formatPercentage` in `src/utils/time.ts` from `"X %"` to `"X%"`, and update unit tests in `src/utils/time.test.ts` and E2E tests in
    `e2e/issue-129.spec.ts` and `e2e/issue-241.spec.ts`.
  - Acceptance: `formatPercentage` returns `"X%"` and both unit and E2E percentage tests pass.
  - Verify: `pnpm test src/utils/time.test.ts`
  - Files: `src/utils/time.ts`, `src/utils/time.test.ts`, `e2e/issue-129.spec.ts`, `e2e/issue-241.spec.ts`

- [x] Task 2: Add date-range overlapping budget calculation and summary depletion formatting utilities
  - Description: Add `getOverlappingBudgetHours` and `formatSummaryBudgetDepletion` to `src/utils/budget.ts` and unit tests in `src/utils/budget.test.ts`
    covering the date-range overlap examples from issue #265.
  - Acceptance: Unit tests verify `0`, `30`, `130`, and `100` hour sums across the issue's 4 example date ranges and format `Budget: X%` (max 1 decimal place,
    e.g. `1.5%` or `17%`) and `X/Y hours`.
  - Verify: `pnpm test src/utils/budget.test.ts`
  - Files: `src/utils/budget.ts`, `src/utils/budget.test.ts`

- [x] Task 3: Render project budget depletion, hover tooltip, and rename checkbox in `Summary.tsx`
  - Description: Update `src/components/Summary.tsx` to compute overlapping budget hours per project for `selectedDateRange`, render `Budget: X%`
    (`data-testid="summary-budget-depletion-<label>"`) below the project name when `!listByTasks` and budget sum `> 0`, wrap it in a Mantine `Tooltip` showing
    `X/Y hours`, and rename the "Show percentages" checkbox to "Project allocation (%)".
  - Acceptance: `pnpm tsc --noEmit` and `pnpm check:invariants` pass with zero errors.
  - Verify: `pnpm tsc --noEmit`
  - Files: `src/components/Summary.tsx`

- [x] Task 4: Add Playwright E2E test for summary budget depletion and update architecture documentation
  - Description: Create `e2e/summary-budget-depletion.spec.ts` verifying summary budget depletion percentages across date ranges, `X/Y hours` hover tooltip,
    coexistence with `Project allocation (%)`, and hiding when `List by task` is checked. Update `docs/architecture.md`.
  - Acceptance: `pnpm test:e2e e2e/summary-budget-depletion.spec.ts e2e/issue-129.spec.ts e2e/issue-241.spec.ts` passes headless.
  - Verify: `pnpm test:e2e e2e/summary-budget-depletion.spec.ts`
  - Files: `e2e/summary-budget-depletion.spec.ts`, `docs/architecture.md`
