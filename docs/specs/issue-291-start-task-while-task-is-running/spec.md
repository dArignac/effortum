# Spec: Be Able to Start a Task While a Task is Running (#291)

## Objective

In #224, a "Restart Task" button (Play icon) was added to the actions column in `TaskListRow` to restart any previously tracked project visible in the selected
date range. However, this button was previously hidden across all rows whenever any task was active (`!hasRunningTask`).

Issue #291 changes this behavior to make switching tasks easier:

1. The "Restart Task" (Play) button remains visible on completed tasks even when another task is active. (The actively running task displays the Stop button
   rather than the Play button).
2. Clicking the Play button on a completed task while another task is running stops the currently active task and then starts the new task.
3. For the end time of the stopped active task and the start time of the new task, the 5-minute rounding preference (`roundToNearest5Minutes`) is respected.
4. The stopped task updates in the UI (e.g. End time input reflects the end time assigned when stopped).

## Tech Stack

- TypeScript
- React 19 + TanStack Start
- Mantine UI (`@mantine/core`, `@mantine/notifications`)
- Zustand (`useEffortumStore`)
- Dexie.js (via store)
- Dayjs (`dayjs`)

## Commands

- Run checks: `pnpm check:invariants`
- Run unit tests: `pnpm test`
- Run E2E tests: `pnpm test:e2e`
- Typecheck: `pnpm tsc --noEmit`

## Project Structure

- `src/components/TaskListRow.tsx` (modified):
  - Change visibility of "Restart Task" (Play) button from `!hasRunningTask` to `!canStopTask` (or `!isRunningTask(task)`), ensuring completed tasks always show
    the Play button.
  - In `restartTask`, check if an active task exists (`tasks.find(isRunningTask)`). If so, stop it via `updateTask` with the current time (applying
    `applyTimeRounding` with `roundToNearest5Minutes`) before calling `addTask` for the new task.
  - Sync row field state (`fieldEnd`) when `task.timeEnd` changes so that when a running task is stopped externally by switching, its input immediately displays
    the assigned end time and resets `hasChanges`.
- `e2e/restart-task.spec.ts` (modified):
  - Update existing test that asserted play buttons were hidden while running.
  - Add tests verifying:
    - Completed tasks retain their Play button while a task is running.
    - Actively running task shows Stop button and does not show Play button.
    - Clicking Play on a completed task stops the active task and starts the new task.
    - 5-minute rounding setting is respected on the stopped task's end time and the new task's start time.
- `src/components/Changelog.tsx` (modified): Add changelog entry for this feature.
- `docs/architecture.md` (modified): Update documentation for task restarting and switching behavior.

## Effortum Architectural Guard

- **Dexie Schema Migration:** No — uses existing tables without schema changes.
- **Store Slice Boundaries:** UI components (`TaskListRow.tsx`) only query and mutate data via Zustand store actions (`updateTask`, `addTask`). No direct Dexie
  imports.
- **Date & Time Operations:** All date and time formatting and comparisons must use `dayjs` (`dayjs().format(...)`). No raw `new Date()`.
- **Single Running Task Invariant:** The invariant is strictly maintained: the active task is stopped via
  `await updateTask(runningTask.id, { timeEnd: currentTime })` before calling `await addTask(...)`. Thus, at no point in Dexie or Zustand are two tasks active
  concurrently.
- **Testing Requirements:** Playwright E2E tests in `e2e/restart-task.spec.ts`.

## Boundaries

- Always: Run `pnpm check:invariants`, write tests alongside code, format with Prettier.
- Ask first: Schema changes, new dependencies, deleting existing tests.
- Never: Direct Dexie imports in UI, naked `new Date()`, `@ts-ignore`, `test.skip`.

## Success Criteria

- Completed task rows display the Play button even when a task is running.
- The active running task displays the Stop button (no Play button).
- Clicking Play on a completed task while a task is running stops the active task (assigning `timeEnd` to `currentTime`, rounded to 5 minutes if setting
  enabled) and starts the new task with `timeStart: currentTime`.
- Stopped task's end time input in the table displays the new end time.
- Both without rounding and with 5-minute rounding enabled, task switching functions correctly.
- All invariant checks (`pnpm check:invariants`), unit tests (`pnpm test`), typechecks (`pnpm tsc --noEmit`), and Playwright E2E tests
  (`pnpm test:e2e e2e/restart-task.spec.ts`) pass.
