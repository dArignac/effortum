# Plan: Be Able to Start a Task While a Task is Running (#291)

## Technical Approach

### 1. Component Dependency Graph

```
      [useEffortumStore (tasks, settings)]
                    │
                    ▼
       [TaskListRow (src/components/TaskListRow.tsx)]
     ├── Determines `canStopTask = isRunningTask(task)`
     ├── Renders `<IconClockPause />` if `canStopTask`
     ├── Renders `<IconPlayerPlay />` if `!canStopTask` (Play button visible even if another task runs)
     └── `restartTask`:
           1. Checks for running task via `tasks.find(isRunningTask)`
           2. Computes `currentTime = applyTimeRounding(dayjs().format("HH:mm"), roundToNearest5Minutes)`
           3. If running task found: `await updateTask(runningTask.id, { timeEnd: currentTime })`
           4. Calls `setEndTimeOfLastStoppedTask(null)`
           5. Calls `await addTask({ ..., timeStart: currentTime, timeEnd: "" })`
                    │
                    ▼
   [Store Layer: taskSlice (src/store/slices/taskSlice.ts)]
     ├── `updateTask` persists `timeEnd` to Dexie and updates state
     └── `addTask` verifies `ensureNoOtherActiveTask` (succeeds because active task is already stopped)
                    │
                    ▼
     [Playwright E2E Suite (e2e/restart-task.spec.ts)]
```

### 2. Implementation Order

1. **Component Update (`src/components/TaskListRow.tsx`):**
   - Update Play button display condition: replace `!hasRunningTask` with `!canStopTask`.
   - Update `restartTask` logic:
     - Compute consistent `currentTime` formatted via `dayjs().format("HH:mm")` and rounded via `applyTimeRounding(now, roundToNearest5Minutes)`.
     - Find running task `tasks.find(isRunningTask)`. If present, await `updateTask(runningTask.id, { timeEnd: currentTime })`.
     - Set `setEndTimeOfLastStoppedTask(null)`.
     - Await `addTask(...)` with `timeStart: currentTime`.
   - Sync `fieldEnd` form state with `task.timeEnd` via `useEffect` so external updates to `timeEnd` reflect immediately in the row's input.
2. **E2E Test Updates (`e2e/restart-task.spec.ts`):**
   - Update the existing test that verified hiding play buttons when a task is running to instead assert that:
     - Completed tasks still display the "Restart Task" button while a task is running.
     - The active task displays the "Stop Task" button and does not display the "Restart Task" button.
   - Add new test cases:
     - Switching tasks: with task A running, clicking Play on task B stops task A, sets task A's end time, and starts task B with start time matching task A's
       end time.
     - Switching tasks with 5-minute rounding enabled: verifies both stopped task's end time and new task's start time are rounded to the nearest 5-minute mark.
3. **Documentation and Changelog Sync:**
   - Update `docs/architecture.md` task restart description.
   - Add changelog entry in `src/components/Changelog.tsx`.
4. **Independent Verification:**
   - Run `pnpm check:invariants`
   - Run `pnpm tsc --noEmit`
   - Run `pnpm test`
   - Run `pnpm test:e2e e2e/restart-task.spec.ts`
   - Run `pnpm prettier --check .`

### 3. Risks & Mitigations

- **Risk: Single Running Task invariant violation in `addTask`:**
  - _Context:_ `taskSlice.ts` throws `"Only one active task is allowed. Please stop the running task first."` if an active task exists when `addTask` is called
    with an open task.
  - _Mitigation:_ `updateTask` must be strictly awaited before calling `addTask`. Since `updateTask` commits the end time to Dexie and updates Zustand store
    state before resolving, `ensureNoOtherActiveTask` in `addTask` will see 0 running tasks and pass.
- **Risk: End time / start time mismatch across minute boundaries:**
  - _Mitigation:_ Compute the timestamp `currentTime` once before stopping the active task, and use that identical value for both `updateTask` on the active
    task and `timeStart` on the new task.
- **Risk: Row input desync on stopped task:**
  - _Mitigation:_ Add `useEffect` in `TaskListRowContent` to update `fieldEnd.setValue(task.timeEnd || "")` whenever `task.timeEnd` changes, keeping the stopped
    task's input in sync.

### 4. Verification Checkpoints

1. `pnpm check:invariants`
2. `pnpm tsc --noEmit`
3. `pnpm test`
4. `pnpm test:e2e e2e/restart-task.spec.ts`
5. `pnpm prettier --check .`
