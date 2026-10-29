# Tasks: Issue #241

- [x] Task 1: Add "Show percentages" toggle to `Summary.tsx`
  - Description: In `src/components/Summary.tsx`, add a local `showPercentages` state defaulted to `false`. Add a `Checkbox` beneath "List by task" with
    `data-testid="checkbox-show-percentages"`, label `"Show percentages"`, and toggle handler. Conditionally render the percentage `Box`
    (`data-testid="summary-percentage-${item.label}"`) only when `showPercentages` is true.
  - Acceptance: "Show percentages" checkbox appears beneath "List by task", is unchecked by default, and controls visibility of percentage elements.
  - Verify: `pnpm tsc --noEmit && pnpm check:invariants`
  - Files: [src/components/Summary.tsx]

- [x] Task 2: Author `e2e/issue-241.spec.ts` and update `e2e/issue-129.spec.ts`
  - Description: Create `e2e/issue-241.spec.ts` testing default unchecked state, absence of percentages by default, showing percentages upon checkbox
    activation, hiding upon deactivation, and working in "List by task" mode. Update `e2e/issue-129.spec.ts` to activate the "Show percentages" checkbox before
    testing percentage values.
  - Acceptance: All tests in both `e2e/issue-241.spec.ts` and `e2e/issue-129.spec.ts` pass cleanly.
  - Verify: `pnpm test:e2e e2e/issue-241.spec.ts e2e/issue-129.spec.ts`
  - Files: [e2e/issue-241.spec.ts, e2e/issue-129.spec.ts]

- [x] Task 3: Full verification and formatting
  - Description: Format repository with Prettier, verify zero invariant violations, run full Vitest unit test suite, and run full Playwright E2E suite.
  - Acceptance: Invariants pass, all unit and E2E tests pass, typecheck passes, and code formatted.
  - Verify: `pnpm check:invariants && pnpm test && pnpm test:e2e && pnpm tsc --noEmit && pnpm prettier --check .`
  - Files: [src/components/Summary.tsx, e2e/issue-241.spec.ts, e2e/issue-129.spec.ts, e2e/summary-running-sum.spec.ts]
