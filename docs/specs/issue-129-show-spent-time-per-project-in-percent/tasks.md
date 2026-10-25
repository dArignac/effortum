# Tasks: Issue #129

- [x] Task 1: Add percentage utility functions and DST-safe time diffs
  - Description: Add `calculatePercentage` and `formatPercentage` in `src/utils/time.ts`. Ensure time difference calculations use a fixed reference date so they
    are unaffected by DST transitions. Add unit tests in `src/utils/time.test.ts` for zero totals, 100%, rounding cases (Example 1 and Example 2 from issue
    #129).
  - Acceptance: Unit tests verify mathematical rounding (`Math.round`), formatting as `X %` with space, zero-handling, and DST safety.
  - Verify: `pnpm test src/utils/time.test.ts && pnpm tsc --noEmit`
  - Files: [src/utils/time.ts, src/utils/time.test.ts]

- [x] Task 2: Update Summary component layout and render percentages
  - Description: In `src/components/Summary.tsx`, apply top vertical alignment (`style={{ verticalAlign: "top" }}`) to table cells. Render
    `formatPercentage(item.time, timeSum)` on a second line under the hours value in column 2, matching font style. Ensure no percentage sum is rendered in the
    footer.
  - Acceptance: Each summary row displays duration on line 1 and `X %` on line 2; icon, duration, and label align to top; footer has no percentage sum.
  - Verify: `pnpm tsc --noEmit && pnpm check:invariants`
  - Files: [src/components/Summary.tsx]

- [x] Task 3: Author Playwright E2E tests for percentage display and alignment
  - Description: Create `e2e/issue-129.spec.ts` with end-to-end tests validating the project percentage calculations (matching issue #129 Example 2), percentage
    display under hours, top vertical alignment, list-by-task mode, and absence of percentage sum in the footer.
  - Acceptance: All Playwright tests in `e2e/issue-129.spec.ts` pass cleanly.
  - Verify: `pnpm test:e2e e2e/issue-129.spec.ts`
  - Files: [e2e/issue-129.spec.ts]

- [x] Task 4: Full verification and formatting
  - Description: Run Prettier formatting, invariant verification, full unit test suite, and full E2E test suite.
  - Acceptance: 0 invariant errors, all unit tests pass, all E2E tests pass, typecheck passes, and code formatted with Prettier.
  - Verify: `pnpm check:invariants && pnpm test && pnpm test:e2e && pnpm tsc --noEmit && pnpm prettier --check .`
  - Files: [src/utils/time.ts, src/utils/time.test.ts, src/components/Summary.tsx, e2e/issue-129.spec.ts]
