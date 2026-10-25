# Spec: feat: show spent time per project in percent (#129)

## Objective

In the summary view (`src/components/Summary.tsx`), show the spent time per project (and per item) as an integer percentage value rounded mathematically
(`Math.round`), formatted as `X %` (e.g. `17 %`). The percentage value is displayed directly underneath the hours value in the same font style. The clipboard
icon (column 1), hours value (column 2), and project/task name (column 3) are aligned horizontally at the top (`vertical-align: top`). If the project or task
name wraps across multiple lines, the second line of the name aligns with the percentage value. No percentage sum is displayed in the footer table.

## Acceptance Criteria

1. **Percentage Calculation & Formatting:**
   - Percentage is calculated as `Math.round((item.time / timeSum) * 100)`.
   - If `timeSum === 0`, percentage is `0 %`.
   - The percentage must be an integer without decimals.
   - Formatted as `X %` (space before `%`, e.g., `17 %`, `0 %`, `100 %`).
   - Rounding is standard mathematical rounding (`Math.round`), so the sum of individual percentages will naturally fall between 99% and 101% for multi-item
     distributions without needing artificial adjustment.
   - Example 1: 04:00 (240 min) and 02:00 (120 min) out of 06:00 (360 min) -> 67 % and 33 % (or 66 % / 33 % per issue note; standard mathematical rounding
     yields `Math.round(240/360*100) = 67%`).
   - Example 2: 01:30 (90 min), 0:45 (45 min), 6:15 (375 min) out of 510 min -> 18 %, 9 %, 74 % (sum = 101 %).

2. **Layout & Alignment in Summary Table:**
   - Table cells in the body rows are aligned to the top (`vertical-align: top`).
   - Line 1 contains: clipboard icon (when in project mode), hours value (`formatDuration`), and project/task name.
   - Line 2 contains: percentage value (`X %`) under hours value, and any wrapped line(s) of the project/task name.
   - Percentage has the same font style as the hours value.
   - Works consistently in both default project grouping and "List by task" mode.

3. **Footer:**
   - No percentage sum is shown in the footer table rows (`summary-sum-row` and `summary-sum-including-running-row`).
   - Existing hours sum display remains intact.

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

- `src/utils/time.ts`: Add `calculatePercentage(part: number, total: number): number` and `formatPercentage(part: number, total: number): string`. Also use a
  neutral reference date in `getDuration` and `getDurationAsTime` so time calculations are DST-safe.
- `src/utils/time.test.ts`: Add comprehensive unit tests for percentage calculation and formatting.
- `src/components/Summary.tsx`: Integrate percentage display under duration with top vertical alignment, add `data-testid` attributes.
- `e2e/issue-129.spec.ts`: Dedicated Playwright E2E tests verifying the percentage display, multi-line wrapping alignment, and absence of percentage sum.

## Effortum Architectural Guard

- **Dexie Schema Migration:** No. This is a purely derived UI calculation and display change. No database schema changes or migrations are needed.
- **Store Slice Boundaries:** No store slice modifications needed. UI consumes data strictly via `useEffortumStore`.
- **Date & Time Operations:** All date/time logic uses `dayjs` (e.g. in `time.ts`). No raw `new Date()`.
- **Single Running Task Invariant:** Unaffected. Does not modify task creation, editing, or start/stop logic.
- **Testing Requirements:**
  - Unit tests in `src/utils/time.test.ts` for percentage calculations, edge cases (0 total, 0 part, 100%, rounding cases from issue description).
  - Playwright E2E tests in `e2e/issue-129.spec.ts` testing the summary percentage display, formatting, list-by-task mode, and footer exclusion.

## Boundaries

- Always: Run `pnpm check:invariants`, write tests alongside code, format with Prettier.
- Ask first: Schema changes, new dependencies, deleting existing tests.
- Never: Direct Dexie imports in UI, naked `new Date()`, `@ts-ignore`, `test.skip`.

## Success Criteria

1. `calculatePercentage` and `formatPercentage` in `src/utils/time.ts` accurately compute mathematical percentages and format them as `X %`.
2. `src/components/Summary.tsx` displays the percentage value below the hours value for each project or task row.
3. The clipboard icon, hours value, and project name align horizontally at the top.
4. No percentage sum is shown in the footer.
5. All invariant checks pass (`pnpm check:invariants`).
6. All unit tests pass (`pnpm test`).
7. Playwright E2E tests pass (`pnpm test:e2e e2e/issue-129.spec.ts`).
8. TypeScript typecheck passes (`pnpm tsc --noEmit`).
