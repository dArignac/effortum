# Plan: Correct Project Budget Depletion Calculation in Summary (#270)

## Technical Approach

### 1. Component Dependency Graph

```
[Models & Date Utils (ProjectBudget, normalizeDate, dayjs)]
                        │
                        ▼
    [Budget Utility Functions (src/utils/budget.ts)]
   (calculateOverlappingBudgetSpentHours, getOverlappingBudgetHours)
                        │
                        ▼
   [Store Layer: budgetSlice (src/store/slices/budgetSlice.ts)]
             (getProjectBudgetSpentHours)
                        │
                        ▼
         [UI Layer (src/components/Summary.tsx)]
     (displays cumulative budget depletion per project)
                        │
                        ▼
 [End-to-End Tests (e2e/summary-budget-depletion.spec.ts)]
```

### 2. Implementation Order

1. **Pure Utilities & Calculation Logic (`src/utils/budget.ts` & `src/utils/budget.test.ts`):**
   - Implement `calculateOverlappingBudgetSpentHours(budgets, tasks, projectId, selectedDateRange)`.
   - Add unit tests verifying:
     - Issue #270 Example 1: `01.10.26 - 01.10.26`
     - Issue #270 Example 2: `20.09.26 - 31.12.26`
     - Issue #270 Example 3: `15.09.26 - 10.10.26`
     - Edge cases: reversed dates, null date ranges, non-overlapping budgets, empty tasks.
2. **Store Layer Integration (`src/store/slices/budgetSlice.ts`, `src/store/types.ts`, `src/store/slices/budgetSlice.test.ts`):**
   - Add `getProjectBudgetSpentHours(projectId: string, selectedDateRange: [string | null, string | null]): Promise<number>` to `budgetSlice`.
   - Query project tasks from `db.tasks` and calculate spent hours using the calculation utility.
   - Add unit tests in `src/store/slices/budgetSlice.test.ts`.
3. **Summary Component Integration (`src/components/Summary.tsx`):**
   - Maintain state for async spent hours per project: `spentHoursByProjectId`.
   - Fetch spent hours via `getProjectBudgetSpentHours` whenever `selectedDateRange`, `budgets`, or `tasks` change, with in-memory synchronous calculation as
     immediate fallback.
   - Render `formatSummaryBudgetDepletion(spentHours, budgetHours)`.
4. **End-to-End Verification (`e2e/summary-budget-depletion.spec.ts`):**
   - Add Playwright E2E tests for cumulative budget depletion where tasks were logged prior to the selected date range but within the budget window.
5. **Architecture Documentation Sync (`docs/architecture.md`):**
   - Update architecture docs to describe cumulative budget depletion semantics up to the date range end date.

### 3. Risks & Mitigations

- **Risk: Discrepancy between in-memory `tasks` and Dexie database:**
  - _Context:_ `LazyDataLoader` only loads tasks for the currently selected date range into `useEffortumStore.tasks`. Historical tasks prior to the start date
    of `selectedDateRange` exist only in IndexedDB.
  - _Mitigation:_ Query project tasks from Dexie via `getProjectBudgetSpentHours` in `budgetSlice` to ensure complete accuracy across all dates within the
    budget window.
- **Risk: UI flickering while asynchronous spent hours load:**
  - _Mitigation:_ Calculate synchronous fallback from currently loaded `tasks` immediately on render, updating seamlessly when the async Dexie query resolves.
- **Risk: Direct Dexie access in UI violating architectural invariants:**
  - _Mitigation:_ All Dexie queries are kept strictly within `src/store/slices/budgetSlice.ts`. `Summary.tsx` only calls store methods.

### 4. Verification Checkpoints

1. `pnpm test src/utils/budget.test.ts src/store/slices/budgetSlice.test.ts`
2. `pnpm tsc --noEmit`
3. `pnpm check:invariants`
4. `pnpm test:e2e e2e/summary-budget-depletion.spec.ts`
5. `pnpm prettier --check .`
