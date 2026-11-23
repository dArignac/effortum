# Architectural Audit Report: Issue #291

**Date:** 2026-11-23 **Auditor:** Independent Architectural Auditor **Status:** **AUDIT PASSED**

## 1. Deterministic Invariant Verification (`pnpm check:invariants`)

| Rule                           | Description                                                                             | Result   | Details                                                                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no-direct-dexie-in-ui`        | UI components/pages/routes must access data exclusively via Zustand store slices        | **PASS** | No Dexie or db imports in `src/components/TaskListRow.tsx` or `src/components/Changelog.tsx`. Data access handled via `useEffortumStore`. |
| `enforce-dayjs`                | All date/time operations in `src/` must use `dayjs`                                     | **PASS** | All date/time handling uses `dayjs().format(...)` and `applyTimeRounding`. Zero raw `new Date()` instances.                               |
| `dexie-migration-immutability` | Historical Dexie migrations (1..8) in `src/db.ts` must remain immutable                 | **PASS** | `src/db.ts` untouched. All migrations 1 through 8 preserved intact.                                                                       |
| `no-suppressed-tests-or-types` | Prohibits `@ts-ignore`, `@ts-nocheck`, `it.skip`, `test.skip`, `describe.skip`, `.only` | **PASS** | Zero suppression directives or skipped tests in modified or created files.                                                                |

## 2. Test Suite & Test Integrity Verification

- **Unit Tests (`pnpm test`):**
  - No unit tests were deleted, commented out, or had assertions weakened.
  - Per project architecture guidelines, UI components are tested via Playwright E2E tests (`AGENTS.md`).
- **E2E Tests (`e2e/restart-task.spec.ts`):**
  - Extended test suite to 6 comprehensive tests in `e2e/restart-task.spec.ts`.
  - Verifies:
    1. Action button layout and Play button placement.
    2. Completed tasks retain Play button while another task is running; running task shows Stop button.
    3. Clicking Restart on a completed task stops the active task and starts the new task with identical timestamp.
    4. 5-minute rounding applies to new task start time.
    5. 5-minute rounding applies to both stopped task's end time and new task's start time on switch.
    6. Action button row layout remains on a single line.

## 3. Type Safety (`pnpm tsc --noEmit`)

- Zero TypeScript compilation errors.
- Strict typing observed across all modified components and tests.

## 4. Single Running Task Invariant

- Strict sequencing in `restartTask`:
  - Active task stopped first via `await updateTask(runningTask.id, { timeEnd: currentTime })`.
  - `setEndTimeOfLastStoppedTask(null)` clears stale intermediate state.
  - `await addTask(...)` creates the new running task with `currentTime`.
  - At no point do two running tasks coexist in Dexie or the Zustand store.
  - UI reactivity: `useEffect` on `task.timeEnd` ensures the stopped task row updates its end-time input immediately without leaving uncommitted form changes.

## 5. Architecture Synchronization

- **`docs/architecture.md`**: Updated accurately in Key Constraints (lines 104-106) describing the task restarting and switching behavior.
- **`src/components/Changelog.tsx`**: Version incremented to `0.23.0` with release notes referencing Issue #291.
- **`docs/specs/issue-291-start-task-while-task-is-running/tasks.md`**: All 3 tasks verified and checked off.

## 6. Code Formatting (`pnpm prettier --check`)

- All modified files conform to Prettier formatting guidelines and `.prettierrc` configuration.

---

### Conclusion

**AUDIT PASSED.** The implementation is sound, strictly adheres to all repository invariants, preserves single-running-task constraints, includes comprehensive
E2E coverage, and keeps documentation in sync. Ready for Human Gate 2.
