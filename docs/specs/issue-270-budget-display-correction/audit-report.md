# Architectural Audit Report: Issue #270

**Date:** 2026-11-11 **Auditor:** Independent Architectural Auditor **Verdict:** AUDIT PASSED

## Executive Summary

Issue #270 corrects the project budget depletion calculation in the Summary panel on the Time Collector page. Previously, the summary panel used only tasks
within the currently filtered date range to calculate budget depletion. In accordance with Issue #270, the calculation now determines cumulative used budget
hours from the start date of each active budget up to $\min(\text{budget.endDate}, \text{rangeEnd})$.

All changes adhere strictly to the repository's architectural invariants, maintain complete test integrity, pass all unit and E2E test suites, and are
synchronized with `docs/architecture.md`.

## Detailed Verification Matrix

### 1. Invariant Script Verification (`scripts/check-invariants.ts`)

- **`no-direct-dexie-in-ui`:** PASSED. `src/components/Summary.tsx` does not import Dexie or `src/db`. It calls `getProjectBudgetSpentHours` via Zustand store
  slice (`useEffortumStore`).
- **`enforce-dayjs`:** PASSED. All date comparisons and normalizations in `src/utils/budget.ts`, `src/store/slices/budgetSlice.ts`, and
  `src/components/Summary.tsx` use `dayjs` and `normalizeDate`. No raw `new Date()` calls are introduced.
- **`dexie-migration-immutability`:** PASSED. `src/db.ts` was not modified; historical schema versions 1..8 remain immutable.
- **`no-suppressed-tests-or-types`:** PASSED. Zero `@ts-ignore`, `@ts-nocheck`, `it.skip`, `test.skip`, `describe.skip`, or test isolation (`.only`) directives
  exist in any modified or new test files.

### 2. Algorithmic Correctness against Issue #270

The calculation implemented in `calculateOverlappingBudgetSpentHours` (`src/utils/budget.ts`):

1. Identifies active budget intervals overlapping with `[rangeStart, rangeEnd]`.
2. Computes the effective end date for each active budget as $\min(\text{budget.endDate}, \text{rangeEnd})$.
3. Sums finished project tasks (`task.timeEnd` defined) falling within any active budget's $[B.\text{startDate}, \text{effectiveEnd}]$.
4. Verified against all concrete examples from Issue #270:
   - Example 1: `01.10.26 - 01.10.26` -> 17 hours spent.
   - Example 2: `20.09.26 - 31.12.26` -> 24 hours spent.
   - Example 3: `15.09.26 - 10.10.26` -> 17 hours spent.

### 3. Store Layer & Asynchronous Loading

- Added `getProjectBudgetSpentHours(projectId, selectedDateRange)` to `budgetSlice.ts` and `EffortumStore` interface in `src/store/types.ts`.
- `Summary.tsx` fetches cumulative spent hours asynchronously from Dexie via the store slice, while providing immediate synchronous fallback from loaded tasks
  to prevent UI flickering.

### 4. Test Suite & Regression Audit

- **Unit Tests (`src/utils/budget.test.ts`):** 7 new comprehensive unit tests added covering Issue #270 examples, reversed dates, single-day selection, and
  zero-task edge cases. No existing tests deleted or modified.
- **Store Tests (`src/store/slices/budgetSlice.test.ts`):** Added store unit tests verifying Dexie query and calculation flow.
- **E2E Tests (`e2e/summary-budget-depletion.spec.ts`):** Added Playwright E2E test verifying cumulative budget spent hours update dynamically upon adding
  tasks. All 6 E2E tests pass.

### 5. Architecture Documentation Sync

- `docs/architecture.md` (lines 92–97) updated to document that used budget hours are calculated cumulatively from each active budget's start date up to and
  including the end date of the selected date range.

## Conclusion

The implementation is verified clean, complete, and fully aligned with repository invariants. **Status: READY FOR HUMAN GATE 2 (Diff & PR Approval).**
