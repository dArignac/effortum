# Tasks: Issue #51

- [x] Task 1: Reset addition row fields and set `endTimeOfLastStoppedTask` on manual finished task creation
  - Description: In `src/components/AddEntry.tsx`, keep the existing `endTimeOfLastStoppedTask` prefill `useEffect` unchanged. In `addEntry()` after
    `await addTask(...)`, call `fieldStart.reset()`, `fieldEnd.reset()`, `fieldProject.reset()`, and `fieldComment.reset()`, set
    `lastPrefilledTimeRef.current = null`, and call `setEndTimeOfLastStoppedTask(!runningTask && roundedEndValue ? roundedEndValue : null)`.
  - Acceptance: `AddEntry.tsx` compiles cleanly, invariants pass, and existing unit tests pass.
  - Verify: `pnpm tsc --noEmit && pnpm check:invariants && pnpm test`
  - Files: [src/components/AddEntry.tsx]

- [x] Task 2: Add Playwright E2E test suite for Issue #51
  - Description: Create `e2e/issue-51.spec.ts` covering: (1) adding a finished task when no active task is running prefills `start` with the task's `end` time
    and clears `end`, `project`, and `comment` while keeping `date`; (2) consecutive finished task additions chain the prefilled `start` time without manually
    re-entering `start`; (3) 5-minute rounding (`roundToNearest5Minutes`) prefills `start` with the rounded `end` time; (4) adding a finished task while an
    active task is running on another date clears `start`, `end`, `project`, and `comment` to `""`; (5) updating the just-added task's `end` time in
    `TaskListRow` updates the prefilled `start` time unless the user manually typed a custom `start` time.
  - Acceptance: All tests in `e2e/issue-51.spec.ts` and related prefill/creation E2E specs pass headless.
  - Verify: `pnpm test:e2e e2e/issue-51.spec.ts e2e/task-stop-start-prefill.spec.ts e2e/task-creation.spec.ts e2e/multiple-active-tasks-prevention.spec.ts`
  - Files: [e2e/issue-51.spec.ts]

- [x] Task 3: Sync architecture documentation and run formatting/verification checks
  - Description: Update `docs/architecture.md` (`Key Constraints`) to document that stopping an active task or manually adding a finished task when no active
    task is running resets the addition row and prefills its start time with that task's end time via `endTimeOfLastStoppedTask`. Format modified files with
    Prettier and verify invariants and unit tests.
  - Acceptance: `docs/architecture.md` is updated, Prettier check passes, invariant check passes, and unit tests pass.
  - Verify:
    `pnpm prettier --write docs/architecture.md docs/specs/issue-51-prefill-start-time-on-manual-task-add/ src/components/AddEntry.tsx e2e/issue-51.spec.ts && pnpm check:invariants && pnpm tsc --noEmit && pnpm test`
  - Files: [docs/architecture.md]
