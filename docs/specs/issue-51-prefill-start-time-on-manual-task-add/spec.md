# Spec: fix: if a task is fully added manually, set the start time to that tasks end time (#51)

## Objective

When no active task is running and the user manually adds a finished task (i.e., a task with a non-empty `end` time) via the task addition row (`AddEntryRow`),
the addition row must reset its fields and prefill the `start` field using the exact same `endTimeOfLastStoppedTask` store mechanism used when stopping a
running task:

1. Reset the addition row's `start`, `end`, `project`, and `comment` fields (`fieldStart.reset()`, `fieldEnd.reset()`, `fieldProject.reset()`,
   `fieldComment.reset()`) and clear `lastPrefilledTimeRef.current = null`.
2. When no active task is running (`!runningTask`) and the newly created task has an end time (`Boolean(roundedEndValue)`), call
   `setEndTimeOfLastStoppedTask(roundedEndValue)` so the existing `useEffect` in `AddEntryRow` prefills `add-entry-input-start-time` with the newly created
   task's persisted `timeEnd` (including 5-minute rounding when `roundToNearest5Minutes` is enabled). Otherwise, call `setEndTimeOfLastStoppedTask(null)`.
3. Keep `add-entry-input-end-time`, `add-entry-input-project`, and `add-entry-input-comment` empty (`""`), while preserving the selected `date`
   (`add-entry-input-date`).
4. Leave the existing `endTimeOfLastStoppedTask` prefill `useEffect` in `AddEntryRow` unchanged so prefilling, subsequent `TaskListRow` end-time adjustments,
   and manual custom start-time edits behave identically to stopping a running task.

## Acceptance Criteria

1. **Manual Finished Task Addition (No Active Task Running):**
   - Given no active (incomplete) task is running anywhere in the application, when the user fills `start`, `end`, `project` (and optionally `comment`) and
     clicks `Add` (`button-add-task`), the task is persisted and:
     - `add-entry-input-start-time` is prefilled via `endTimeOfLastStoppedTask` with the newly created task's persisted `timeEnd` (respecting
       `roundToNearest5Minutes` if enabled).
     - `add-entry-input-end-time` has value `""`.
     - `add-entry-input-project` has value `""`.
     - `add-entry-input-comment` has value `""`.
     - `add-entry-input-date` retains the selected date.
2. **Consecutive Manual Task Additions:**
   - Adding multiple finished tasks back-to-back updates `add-entry-input-start-time` each time to the latest added task's `timeEnd` while clearing `end`,
     `project`, and `comment`, allowing the user to immediately enter the next `end`, `project`, and `comment` without re-typing `start`.
3. **Manual Finished Task Addition While an Active Task Is Running:**
   - Given an active task is running (e.g., on another date outside the selected date range) and the user adds a finished task on the current view, the addition
     row resets `start`, `end`, `project`, and `comment` to `""` and sets `endTimeOfLastStoppedTask(null)` (no `start` prefill while an active task is running).
4. **Identical Prefill Behavior to Stopping a Running Task:**
   - Updating the `timeEnd` of the just-added finished task in `TaskListRow` updates the prefilled `start` time if the user has not typed a different start
     time, and preserves a manually typed custom start time (matching `e2e/task-stop-start-prefill.spec.ts`).
   - Navigating away and returning to the Time Collector page preserves the prefilled `start` time via `endTimeOfLastStoppedTask` while keeping `end`,
     `project`, and `comment` empty.

## Tech Stack

- TypeScript
- React 19
- Mantine UI (`@mantine/core`, `@mantine/dates`, `@mantine/form`)
- Zustand (`useEffortumStore`)
- Dexie.js
- Dayjs
- Vitest & Playwright

## Commands

- Run checks: `pnpm check:invariants`
- Run unit tests: `pnpm test`
- Run E2E tests: `pnpm test:e2e`
- Typecheck: `pnpm tsc --noEmit`
- Format check: `pnpm prettier --check .`

## Project Structure

Files to be created or modified:

- `src/components/AddEntry.tsx`: In `addEntry()` after `await addTask(...)`, reset `fieldStart`, `fieldEnd`, `fieldProject`, and `fieldComment`, set
  `lastPrefilledTimeRef.current = null`, and call `setEndTimeOfLastStoppedTask(!runningTask && roundedEndValue ? roundedEndValue : null)`, leaving the existing
  prefill `useEffect` untouched.
- `e2e/issue-51.spec.ts`: New Playwright E2E test suite covering manual finished task addition, consecutive additions, 5-minute rounding interaction, active
  running task on another date, and parity with stopped-task prefill behavior (adjusting end time / preserving custom start time).
- `docs/architecture.md`: Document addition-row reset and start-time prefill behavior under Key Constraints.

## Effortum Architectural Guard

- **Dexie Schema Migration:** No. No database schema or table changes are required in `src/db.ts`.
- **Store Slice Boundaries:** No new store state is needed; `AddEntryRow` reuses `endTimeOfLastStoppedTask` and `setEndTimeOfLastStoppedTask` from `uiSlice` via
  `useEffortumStore`. Zero direct Dexie imports in UI.
- **Date & Time Operations:** All date and time operations use `dayjs` and existing helpers in `src/utils/time.ts`. No raw `new Date()` in `src/`.
- **Single Running Task Invariant:** Preserved. Prefilling `start` via `setEndTimeOfLastStoppedTask(roundedEndValue)` occurs strictly when `!runningTask` and
  `roundedEndValue` is non-empty. Single-active-task validation and guards remain untouched.
- **Testing Requirements:**
  - Playwright E2E tests in `e2e/issue-51.spec.ts` verifying UI behavior end-to-end (per `AGENTS.md`, UI functionality is tested via Playwright E2E rather than
    unit tests).
  - Existing unit tests (`pnpm test`) and Playwright E2E suites (`e2e/task-stop-start-prefill.spec.ts`, `e2e/task-creation.spec.ts`,
    `e2e/multiple-active-tasks-prevention.spec.ts`, etc.) must pass without regression.

## Boundaries

- Always: Run `pnpm check:invariants`, write tests alongside code, format with Prettier.
- Ask first: Schema changes, new dependencies, deleting existing tests.
- Never: Direct Dexie imports in UI, naked `new Date()`, `@ts-ignore`, `test.skip`.

## Success Criteria

1. Adding a finished task when no active task is running resets `end`, `project`, and `comment` to `""` and prefills `add-entry-input-start-time` with the
   created task's `timeEnd` via `setEndTimeOfLastStoppedTask(roundedEndValue)` and the existing `AddEntryRow` prefill `useEffect`.
2. Consecutive finished tasks can be added using the prefilled `start` time without stale values from prior tasks remaining in `end`, `project`, or `comment`.
3. Adding a finished task while an active task is running on another date resets `start`, `end`, `project`, and `comment` to `""`.
4. All invariant checks (`pnpm check:invariants`), typechecks (`pnpm tsc --noEmit`), unit tests (`pnpm test`), E2E tests (`pnpm test:e2e`), and Prettier checks
   pass with zero errors.
