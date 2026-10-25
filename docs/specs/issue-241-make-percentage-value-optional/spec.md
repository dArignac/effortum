# Spec: feat: make percentage value optional (#241)

## Objective

In the summary view (`src/components/Summary.tsx`), provide a checkbox labeled "Show percentages" directly beneath the "List by task" checkbox. By default, this
checkbox is unchecked, and percentage values (added in #129) are not shown. When the checkbox is checked, the percentage values are shown below each duration in
the summary table. There is no change in the calculation or behavior of the percentage values, only their visibility.

## Acceptance Criteria

1. **Checkbox Placement & Label:**
   - Directly beneath the "List by task" checkbox, render a Mantine `Checkbox` component.
   - Checkbox label must be `"Show percentages"`.
   - Checkbox must have attribute `data-testid="checkbox-show-percentages"`.
   - Checked state defaults to `false` (unchecked).

2. **Conditional Visibility:**
   - When the checkbox is unchecked (default), the percentage elements (`data-testid="summary-percentage-<label>"`) are not shown in the DOM.
   - When the checkbox is checked, the percentage elements are rendered displaying the formatted percentage (`X %`).
   - Toggling the checkbox on and off immediately updates visibility of percentage values across all summary items.
   - Percentage visibility toggles correctly in both default project grouping mode and "List by task" mode.

3. **Behavioral Invariance:**
   - The percentage calculation (`formatPercentage`, `calculatePercentage`) remains unchanged.
   - Table cell top-alignment and hours duration display are unchanged.
   - Footer rows (`summary-sum-row` and `summary-sum-including-running-row`) do not display percentage sums.

4. **Testing & Backward Compatibility:**
   - Existing E2E tests in `e2e/issue-129.spec.ts` are updated to check "Show percentages" where percentage text is verified, and to verify default hidden
     state.
   - New dedicated E2E tests in `e2e/issue-241.spec.ts` validate default unchecked state, visibility toggling, and interaction with "List by task".

## Tech Stack

- TypeScript
- React 19
- Mantine UI
- Zustand
- Dexie.js
- Dayjs
- Vitest & Playwright

## Commands

- Run invariant checks: `pnpm check:invariants`
- Run unit tests: `pnpm test`
- Run E2E tests: `pnpm test:e2e`
- Typecheck: `pnpm tsc --noEmit`
- Format check: `pnpm prettier --check .`

## Project Structure

Files to be modified / created:

- `src/components/Summary.tsx`: Add local React state `showPercentages` initialized to `false`, add the "Show percentages" `Checkbox` below "List by task", and
  conditionally render the percentage `Box`.
- `e2e/issue-129.spec.ts`: Update tests to activate "Show percentages" when validating percentage rendering.
- `e2e/issue-241.spec.ts`: Dedicated Playwright E2E tests for the optional percentage visibility toggle.

## Effortum Architectural Guard

- **Dexie Schema Migration:** No. This is a local UI visibility toggle. No database schema changes or migrations are needed.
- **Store Slice Boundaries:** No store slice modifications needed. Local UI state in `Summary.tsx` is sufficient and follows the precedent set by `listByTasks`.
- **Date & Time Operations:** All date/time logic uses `dayjs`. No raw `new Date()`.
- **Single Running Task Invariant:** Unaffected. Does not touch task tracking, creation, or start/stop logic.
- **Testing Requirements:**
  - Playwright E2E tests in `e2e/issue-241.spec.ts` testing default unchecked state (percentages hidden), toggling checkbox shows percentages, toggling off
    hides percentages, and behavior under "List by task".
  - Existing E2E suite (`e2e/issue-129.spec.ts`, etc.) must remain green.

## Boundaries

- Always: Run `pnpm check:invariants`, write tests alongside code, format with Prettier.
- Ask first: Schema changes, new dependencies, deleting existing tests.
- Never: Direct Dexie imports in UI, naked `new Date()`, `@ts-ignore`, `test.skip`.

## Success Criteria

1. Checkbox with label "Show percentages" and `data-testid="checkbox-show-percentages"` is rendered directly beneath "List by task".
2. Default state is unchecked and percentage values are not displayed.
3. Checking the checkbox reveals percentage values for all summary rows.
4. Unchecking the checkbox hides percentage values.
5. All invariant checks pass (`pnpm check:invariants`).
6. All unit tests pass (`pnpm test`).
7. All Playwright E2E tests pass (`pnpm test:e2e`).
8. TypeScript typecheck passes (`pnpm tsc --noEmit`).
