# Spec: Display Project Budget Depletion in Summary Panel and Format Percentages Without Space (#265)

## Objective

Parent issue: #258 (Part 2). Depends on: #264.

Display the overall project budget depletion percentage (`Budget: X%`, formatted to at most 1 decimal place) with a detailed hover tooltip (`X/Y hours`) below
the project name in the `Summary` panel on the Time Collector page for the selected date range, rename the "Show percentages" checkbox to "Project allocation
(%)", and standardize percentage formatting in the summary from `X %` to `X%`.

### Acceptance Criteria

1. **Percentage Format Standardization (`src/utils/time.ts`):**
   - Update `formatPercentage(part, total)` to format percentages without a space before `%` (`"X%"` instead of `"X %"`, e.g. `"65%"`).
   - Update existing unit tests (`src/utils/time.test.ts`) and E2E tests (`e2e/issue-129.spec.ts`, `e2e/issue-241.spec.ts`) to match the standardized `"X%"`
     format.
2. **Date-Range Budget Depletion Basis (`src/utils/budget.ts`):**
   - For a given project and `selectedDateRange` (`[startDate, endDate]`), sum `hours` across all budgets belonging to that project whose
     `[budget.startDate, budget.endDate]` interval overlaps the selected date range (`budget.startDate <= rangeEnd && budget.endDate >= rangeStart` at day
     precision).
   - Example with Project A budgets `01.10.26 - 31.12.26` (100h) and `15.09.26 - 01.11.26` (30h):
     - Selected range `14.09.26 - 14.09.26` → Sum = `0` → Depletion value not shown.
     - Selected range `15.09.26 - 15.09.26` → Sum = `30` → Depletion = `formatDepletionPercentage(spentHours, 30)` (max 1 decimal place, e.g. `1.5%` or `17%`).
     - Selected range `01.10.26 - 07.10.26` → Sum = `130` → Depletion = `formatDepletionPercentage(spentHours, 130)`.
     - Selected range `02.11.26 - 31.12.26` → Sum = `100` → Depletion = `formatDepletionPercentage(spentHours, 100)`.
3. **Summary Panel Rendering & Tooltip (`src/components/Summary.tsx`):**
   - When `List by task` is unchecked and a project has an overlapping budget sum `Y > 0` for `selectedDateRange`:
     - Render `Budget: X%` (`data-testid="summary-budget-depletion-<projectName>"`) on a second line below the project name in the project cell, regardless of
       whether `Project allocation (%)` is checked.
     - When `Project allocation (%)` is also checked, the time cell shows the time share percentage (`65%`) on its second line while the project cell shows
       `Budget: 75%` on its second line.
     - Hovering over the `Budget: X%` element displays a Mantine `Tooltip` with `X/Y hours`, where `X` is the project's spent hours in `selectedDateRange` and
       `Y` is the sum of valid budget hours for `selectedDateRange` (formatted via `formatBudgetMetricNumber`).
   - The checkbox previously named "Show percentages" is renamed to "Project allocation (%)" (`data-testid="checkbox-show-percentages"`).
   - When `List by task` is checked, or when the sum of valid budgets for the project on `selectedDateRange` is `0`, no depletion value is rendered.

## Tech Stack

- TypeScript
- React 19 + TanStack Start
- Mantine UI (`@mantine/core` `Tooltip`, `Box`, `Table`, `Checkbox`)
- Zustand (`src/store`)
- Dayjs (`dayjs`)

## Commands

- Run checks: `pnpm check:invariants`
- Run unit tests: `pnpm test`
- Run E2E tests: `pnpm test:e2e`
- Typecheck: `pnpm tsc --noEmit`

## Project Structure

- `src/utils/time.ts` & `src/utils/time.test.ts` (modified): Change `formatPercentage` output from `"X %"` to `"X%"` and update unit tests.
- `src/utils/budget.ts` & `src/utils/budget.test.ts` (modified): Add `getOverlappingBudgetHours` and `formatSummaryBudgetDepletion` helpers and unit tests.
- `src/components/Summary.tsx` (modified): Render `Budget: X%` with `X/Y hours` Mantine `Tooltip` below project names when `!listByTasks` and valid budget hours
  `> 0`, and rename the "Show percentages" checkbox to "Project allocation (%)".
- `e2e/issue-129.spec.ts` & `e2e/issue-241.spec.ts` (modified): Update expected percentage strings from `"X %"` to `"X%"` and checkbox label to
  `"Project allocation (%)"`.
- `e2e/summary-budget-depletion.spec.ts` (new): Playwright E2E tests verifying date-range budget depletion in the summary panel, hover tooltip `X/Y hours`,
  interaction with `Project allocation (%)` and `List by task` checkboxes, and hiding when no budget overlaps.
- `docs/architecture.md` (modified): Document summary panel project budget depletion behavior.

## Effortum Architectural Guard

- **Dexie Schema Migration:** No — uses the existing `budgets` table introduced in `version(8)` (#264).
- **Store Slice Boundaries:** No store slice modifications required; `Summary.tsx` reads `budgets`, `tasks`, `projects`, and `selectedDateRange` from
  `useEffortumStore`.
- **Date & Time Operations:** All date parsing and overlap comparisons in `getOverlappingBudgetHours` use `dayjs` (`normalizeDate`). No raw `new Date()`.
- **Single Running Task Invariant:** Untouched.
- **Testing Requirements:** Unit tests in `src/utils/time.test.ts` and `src/utils/budget.test.ts`, updated E2E tests in `e2e/issue-129.spec.ts` and
  `e2e/issue-241.spec.ts`, and new E2E tests in `e2e/summary-budget-depletion.spec.ts`.

## Boundaries

- Always: Run `pnpm check:invariants`, write tests alongside code, format with Prettier.
- Ask first: Schema changes, new dependencies, deleting existing tests.
- Never: Direct Dexie imports in UI, naked `new Date()`, `@ts-ignore`, `test.skip`.

## Success Criteria

- `formatPercentage` returns `"X%"` without a space, and `e2e/issue-129.spec.ts` and `e2e/issue-241.spec.ts` pass.
- In the `Summary` panel, projects with overlapping budgets in `selectedDateRange` display `Budget: X%` (max 1 decimal place, e.g. `1.5%` or `17%`) below the
  project name when `List by task` is unchecked.
- Hovering `Budget: X%` shows the tooltip `X/Y hours`.
- Checking `List by task` or selecting a date range with zero overlapping budgets hides `Budget: X%`.
- `pnpm check:invariants`, `pnpm tsc --noEmit`, `pnpm test`, and `pnpm test:e2e` pass with zero errors.
