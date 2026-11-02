# Plan: fix: if a task is fully added manually, set the start time to that tasks end time (#51)

## 1. Component Dependency Graph

```text
[uiSlice (useEffortumStore)]
  └── endTimeOfLastStoppedTask / setEndTimeOfLastStoppedTask
         ▲                          │
         │ (sets roundedEndValue    │ (existing prefill useEffect
         │  when !runningTask       │  populates fieldStart)
         │  && roundedEndValue)     ▼
[AddEntry.tsx (AddEntryRow)] ◄──────┘
  └── Post-add reset in addEntry():
        ├── fieldStart.reset()
        ├── fieldEnd.reset()
        ├── fieldProject.reset()   ──► clears projectValue ──► clears availableComments
        ├── fieldComment.reset()
        ├── lastPrefilledTimeRef.current = null
        └── setEndTimeOfLastStoppedTask(!runningTask && roundedEndValue ? roundedEndValue : null)
         ▲
         │ (End-to-End Verification & Architecture Sync)
         │
[Playwright E2E & Docs]
  ├── e2e/issue-51.spec.ts (new E2E verification scenarios)
  ├── e2e/task-stop-start-prefill.spec.ts & full E2E suite (regression verification)
  └── docs/architecture.md (updated Key Constraints)
```

## 2. Implementation Order

1. **Reset Addition Row & Trigger Existing Store Prefill (`src/components/AddEntry.tsx`):**
   - Keep the existing `endTimeOfLastStoppedTask` `useEffect` completely unchanged so prefilling works identically to stopping a running task.
   - In `addEntry()`, immediately after `await addTask(...)` succeeds:
     - Reset the addition row inputs: `fieldStart.reset()`, `fieldEnd.reset()`, `fieldProject.reset()`, and `fieldComment.reset()`.
     - Reset `lastPrefilledTimeRef.current = null`.
     - Call `setEndTimeOfLastStoppedTask(!runningTask && roundedEndValue ? roundedEndValue : null)`.
     - Because `fieldStart.reset()` clears `startValue` to `""` and `endTimeOfLastStoppedTask` holds `roundedEndValue` (when `!runningTask && roundedEndValue`),
       the existing `useEffect` automatically prefills `fieldStart` with `roundedEndValue` and records `lastPrefilledTimeRef.current = roundedEndValue`.

2. **Add End-to-End Verification (`e2e/issue-51.spec.ts`):**
   - Test adding a finished task when no active task is running: verify `start` equals the created task's `end` time and `end`, `project`, and `comment` are
     `""`, while `date` remains unchanged.
   - Test consecutive manual additions of finished tasks using the prefilled `start` time without manually re-entering `start`.
   - Test adding a finished task with `roundToNearest5Minutes` enabled: verify `start` is prefilled with the rounded `end` time of the created task.
   - Test adding a finished task while an active task is running on another date: verify `start`, `end`, `project`, and `comment` are all cleared to `""`.
   - Test parity with stopped-task prefill: adjusting the just-added task's `end` time in `TaskListRow` updates the prefilled `start` time, while a manually
     typed custom `start` time is preserved when the task's `end` time is subsequently edited.

3. **Update Architecture Documentation (`docs/architecture.md`):**
   - Document under `Key Constraints` that stopping an active task or manually adding a finished task (when no active task is running) prefills the addition
     row's start time with that task's end time via `endTimeOfLastStoppedTask` while keeping end, project, and comment empty.

## 3. Risks & Mitigations

- **Risk:** Consecutive tasks with identical `roundedEndValue` (e.g., a 0-minute task `10:00`–`10:00` after a task ending at `10:00`) might not change
  `endTimeOfLastStoppedTask`.
  - **Mitigation:** `fieldStart.reset()` transitions `startValue` from `"10:00"` to `""`, which is in `[startValue, endTimeOfLastStoppedTask]` of the existing
    `useEffect`, ensuring `fieldStart` is still prefilled with `"10:00"`.
- **Risk:** Existing E2E tests in `e2e/` add multiple finished tasks sequentially.
  - **Mitigation:** Audited all E2E specs; tests use `.fill(...)` on `start`, `end`, `project`, and `comment` (and `e2e/clipboard-copy.spec.ts` already assumed
    `comment` was cleared between tasks). Run the full `pnpm test:e2e` suite to verify zero regressions.

## 4. Verification Checkpoints

- Checkpoint 1: `pnpm tsc --noEmit && pnpm check:invariants && pnpm test` passes after updating `src/components/AddEntry.tsx`.
- Checkpoint 2: `pnpm test:e2e e2e/issue-51.spec.ts e2e/task-stop-start-prefill.spec.ts e2e/task-creation.spec.ts e2e/multiple-active-tasks-prevention.spec.ts`
  passes.
- Checkpoint 3: Full E2E test suite (`pnpm test:e2e`) and formatting check (`pnpm prettier --check .`) pass cleanly.
