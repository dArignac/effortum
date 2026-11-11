# Spec: Correct Project Budget Depletion Calculation in Summary (#270)

## Objective

Issue #270 addresses an inaccuracy in the budget depletion calculation in the Summary panel on the Time Collector page. Previously (introduced in #265), the
summary panel showed the percentage of budget depleted using only the hours booked within the currently selected date range (`item.time / 60`). Instead, budget
depletion must show the cumulative used budget from the start of each active budget up to and including the end date of the selected date range.

For each budget $B$ belonging to a project:

1. Budget $B$ is active if its validity interval $[B.\text{startDate}, B.\text{endDate}]$ overlaps with the selected date range $[D_{\text{start}},
   D_{\text{end}}]$ ($B.\text{startDate} \le D_{\text{end}}$ and $B.\text{endDate} \ge D_{\text{start}}$ at day precision).
2. For each active budget $B$, the used budget hours are summed from tasks belonging to the project whose date falls within $[B.\text{startDate},
   \min(B.\text{endDate}, D_{\text{end}})]$.
3. When multiple budgets for the same project are active in the selected date range, the total spent hours is the sum of used budget hours across all active
   budgets, and the total budget hours is the sum of $B.\text{hours}$ across all active budgets.
4. The depletion label `Budget: X%` (max 1 decimal place) and tooltip `X/Y hours` reflect this cumulative used budget $X$ over total overlapping budget hours
   $Y$.

### Examples from Issue #270

Budget B-1: `2026-10-01` to `2026-10-30` Budget B-2: `2026-08-01` to `2026-10-15`

- **Date Range `2026-10-01` - `2026-10-01`:**
  - B-1 interval for used budget: `2026-10-01` to `2026-10-01` (from B-1 start `01.10.26` to range end `01.10.26`).
  - B-2 interval (if for this project): `2026-08-01` to `2026-10-01` (from B-2 start `01.08.26` to range end `01.10.26`).
- **Date Range `2026-09-20` - `2026-12-31`:**
  - B-1 interval for used budget: `2026-10-01` to `2026-10-30` (capped at B-1 end date).
  - B-2 interval for used budget: `2026-08-01` to `2026-10-15` (capped at B-2 end date).
- **Date Range `2026-09-15` - `2026-10-10`:**
  - B-1 interval for used budget: `2026-10-01` to `2026-10-10` (from B-1 start `01.10.26` to range end `10.10.26`).
  - B-2 interval for used budget: `2026-08-01` to `2026-10-10` (from B-2 start `01.08.26` to range end `10.10.26`).

## Tech Stack

- TypeScript
- React 19 + TanStack Start
- Mantine UI (`@mantine/core`)
- Zustand (`src/store`)
- Dexie.js (`src/db.ts`)
- Dayjs (`dayjs`)

## Commands

- Run checks: `pnpm check:invariants`
- Run unit tests: `pnpm test`
- Run E2E tests: `pnpm test:e2e`
- Typecheck: `pnpm tsc --noEmit`

## Project Structure

- `src/utils/budget.ts` & `src/utils/budget.test.ts` (modified): Add pure helper function `calculateOverlappingBudgetSpentHours` computing cumulative used hours
  for overlapping budgets against task arrays, plus comprehensive unit tests matching issue #270 specification examples.
- `src/store/slices/budgetSlice.ts` & `src/store/slices/budgetSlice.test.ts` (modified): Add store action
  `getProjectBudgetSpentHours(projectId, selectedDateRange)` querying tasks from Dexie via store slice and calculating spent hours.
- `src/store/types.ts` (modified): Update store interface with `getProjectBudgetSpentHours`.
- `src/components/Summary.tsx` (modified): Update Summary to fetch and display the cumulative used budget hours until the date range end date rather than only
  tasks within `filteredTasks`.
- `e2e/summary-budget-depletion.spec.ts` (modified): Add E2E tests verifying cumulative budget depletion when selecting date ranges where budget started
  earlier.
- `docs/architecture.md` (modified): Document cumulative budget depletion calculation logic up to date range end.

## Effortum Architectural Guard

- **Dexie Schema Migration:** No — uses the existing `budgets` and `tasks` tables without schema changes.
- **Store Slice Boundaries:** UI components (`Summary.tsx`) must never import Dexie directly. All task querying across dates outside the loaded date range must
  go through the Zustand store slice (`getProjectBudgetSpentHours` in `budgetSlice.ts`).
- **Date & Time Operations:** All date parsing and comparisons must use `dayjs` (`normalizeDate`). No raw `new Date()`.
- **Single Running Task Invariant:** Unchanged. Only completed tasks (`task.timeEnd` defined) are counted toward booked/used budget hours.
- **Testing Requirements:** Unit tests in `src/utils/budget.test.ts` and `src/store/slices/budgetSlice.test.ts`, and Playwright E2E tests in
  `e2e/summary-budget-depletion.spec.ts`.

## Boundaries

- Always: Run `pnpm check:invariants`, write tests alongside code, format with Prettier.
- Ask first: Schema changes, new dependencies, deleting existing tests.
- Never: Direct Dexie imports in UI, naked `new Date()`, `@ts-ignore`, `test.skip`.

## Success Criteria

- In Summary panel, budget depletion percentage `Budget: X%` and tooltip `X/Y hours` display cumulative spent hours from each active budget's start date through
  $\min(\text{budget.endDate}, \text{rangeEnd})$.
- All examples from issue #270 are covered in unit tests and pass.
- Playwright E2E tests verify cumulative budget tracking across date ranges.
- `pnpm check:invariants`, `pnpm tsc --noEmit`, `pnpm test`, and `pnpm test:e2e` pass with zero errors.
