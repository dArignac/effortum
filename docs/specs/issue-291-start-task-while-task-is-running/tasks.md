# Tasks: Issue #291

- [x] Task 1: Update TaskListRow Component to Support Starting Tasks While Running
  - Description: Update `src/components/TaskListRow.tsx` so completed tasks display the "Restart Task" (Play) button even when another task is active
    (`!canStopTask`). In `restartTask`, check for any active task via `tasks.find(isRunningTask)` and stop it with `currentTime` (respecting
    `roundToNearest5Minutes` via `applyTimeRounding`) using `updateTask` before calling `addTask`. In `TaskListRowContent`, add a `useEffect` on `task.timeEnd`
    to keep `fieldEnd` in sync when a running task is stopped externally.
  - Acceptance: "Restart Task" button is visible on completed tasks; clicking it while an active task exists stops the active task and starts the new one
    without error.
  - Verify: `pnpm check:invariants && pnpm tsc --noEmit && pnpm test`
  - Files: `src/components/TaskListRow.tsx`

- [x] Task 2: Update and Extend Playwright E2E Tests for Task Switching
  - Description: Update `e2e/restart-task.spec.ts` to assert that completed tasks keep the Play button when a task is running, the running task only shows the
    Stop button, clicking Play on a completed task stops the running task (assigning its end time) and starts the new task, and 5-minute rounding applies to
    both the stopped task's end time and the new task's start time.
  - Acceptance: All tests in `e2e/restart-task.spec.ts` pass headless.
  - Verify: `pnpm test:e2e e2e/restart-task.spec.ts`
  - Files: `e2e/restart-task.spec.ts`

- [x] Task 3: Architecture Documentation, Changelog Entry & Full Verification
  - Description: Update `docs/architecture.md` to reflect the updated task restarting and switching behavior. Add a changelog entry in
    `src/components/Changelog.tsx`. Format modified files with Prettier.
  - Acceptance: Invariants pass, all unit and E2E tests pass, typecheck passes, and repository formatting is clean.
  - Verify: `pnpm check:invariants && pnpm tsc --noEmit && pnpm test && pnpm test:e2e e2e/restart-task.spec.ts && pnpm prettier --check .`
  - Files: `docs/architecture.md`, `src/components/Changelog.tsx`
