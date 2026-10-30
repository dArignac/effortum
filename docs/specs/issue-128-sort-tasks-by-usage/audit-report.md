# Independent Architectural Audit Report

**Issue:** #128 - feat: Sort tasks by usage  
**Auditor:** Independent Architectural Auditor  
**Audit Cycle:** 2 of 2  
**Verdict:** **AUDIT PASSED** ✅

---

## Executive Summary

The Independent Architectural Auditor evaluated the completed diff for Issue #128 (Audit Cycle 2 of 2 following remediation of `src/components/TaskListRow.tsx`)
with zero confirmation bias against `spec.md`, `plan.md`, `tasks.md`, repository architectural invariants (`scripts/check-invariants.ts`), unit and Playwright
end-to-end test suites, TypeScript compiler checks, React Hook Safety rules, Prettier formatting, and `docs/architecture.md` synchronization.

The Cycle 1 Rules of Hooks violation in `src/components/TaskListRow.tsx` has been cleanly resolved by extracting `TaskListRowContent`, ensuring every hook
across `TaskList`, `AddEntryRow`, `TaskListRow`, and `TaskListRowContent` executes unconditionally. All deterministic checks passed with **zero violations**.

---

## Audit Verification Details

### 1. Invariant Script Verification (`scripts/check-invariants.ts`)

Executed `pnpm check:invariants` (exit code `0`):

| Invariant Rule                     | Target Scope                                      | Status   | Notes                                                                                                                         |
| :--------------------------------- | :------------------------------------------------ | :------- | :---------------------------------------------------------------------------------------------------------------------------- |
| **`no-direct-dexie-in-ui`**        | `TaskList.tsx`, `AddEntry.tsx`, `TaskListRow.tsx` | **PASS** | UI queries IndexedDB exclusively via Zustand `useEffortumStore` (`getRecentProjectNames`, `getRecentTaskCommentsForProject`). |
| **`enforce-dayjs`**                | `src/utils/usageSort.ts` and all `src/` files     | **PASS** | Zero raw `new Date()` calls in application code. All recency timestamp calculations use `dayjs`.                              |
| **`dexie-migration-immutability`** | `src/db.ts`                                       | **PASS** | Historical schema versions `1..7` remain frozen and untouched (`src/db.ts` unmodified).                                       |
| **`no-suppressed-tests-or-types`** | `src/`, `e2e/`, `scripts/`                        | **PASS** | Zero `@ts-ignore`, `@ts-nocheck`, `it.skip`, `test.skip`, `describe.skip`, or `.only` directives.                             |

### 2. Unit Test Suite Verification (`pnpm test`)

- **Results:** 12 test suites passed, **114/114** unit tests passed (exit code `0`).
- **New Coverage:**
  - `src/utils/usageSort.test.ts` (10 tests): Covers completed and running task timestamp calculation (`Number.MAX_SAFE_INTEGER` `endMs`), cross-date ordering,
    same-day chronological ordering, running vs. completed tie-breaking on matching start times, unused project placement in case-insensitive alphabetical
    order, deterministic alphabetical tie-breaking, canonical `projectId` rename continuity, legacy `task.project` fallback, and comment whitespace
    trimming/deduplication.
  - `src/store/slices/taskSlice.test.ts` (+3 tests, 10 total): Verifies `getRecentProjectNames` against full `db.tasks` history even when `state.tasks` is
    empty, `getRecentTaskCommentsForProject` indexed query + MRU sorting, and empty `projectId` guard.

### 3. E2E Test Suite Verification (`pnpm test:e2e`)

- **Results:** **131/131** Playwright end-to-end tests passed across Chromium, Firefox, and WebKit (exit code `0`).
- **New Coverage in `e2e/issue-128.spec.ts` (5 scenarios):**
  - Project autocomplete orders options by most recently used and dynamically updates when an older project is reused.
  - Comment autocomplete orders project-scoped comments by most recently used and updates when an older comment is reused.
  - Cross-date usage history persists on an empty day (`Today`) after reload when tasks exist only on `Yesterday`.
  - Substring filtering by typing preserves MRU relative order for both projects and comments.
  - Existing task rows (`TaskListRow`) populate both project and comment autocomplete dropdowns in last-used order.
- **Regression Suites:** Existing suites (`e2e/task-autocomplete.spec.ts`, `e2e/task-editing.spec.ts`, `e2e/projects.spec.ts`, `e2e/tasks.spec.ts`,
  `e2e/project-deletion.spec.ts`) all passed without modification, confirming management views retain alphabetical ordering.

### 4. Typecheck Verification (`pnpm tsc --noEmit`)

- Exited with code `0` and zero TypeScript errors.
- Store contracts (`EffortumStore` in `src/store/types.ts`), sorting helpers (`src/utils/usageSort.ts`), and component props (`projectNames?: string[]`) are
  strictly typed without `any` or compiler suppressions.

### 5. `AGENTS.md` & React Hook Safety Audit

- **Persistence:** `src/db.ts` was not modified; existing v7 `projectId` index supports `getRecentTaskCommentsForProject`.
- **N+1 Avoidance & UI Boundaries:** `TaskList.tsx` fetches `recentProjectNames` once per `[projects, tasks, getRecentProjectNames]` update and passes
  `projectNames` down to `TaskListRow` and `AddEntryRow`.
- **Test Integrity:** Verified via `git diff main` and `git status` that zero existing tests were deleted, skipped, commented out, or had assertions weakened.
- **React Hook Safety (Cycle 1 Remediation Verified):**
  - `src/components/TaskList.tsx`: `recentProjectNames` `useState` and `useEffect` (lines `99–122`) execute unconditionally prior to `if (isDataLoading)` at
    line `125`.
  - `src/components/AddEntry.tsx`: All hooks (`useEffortumStore`, `useState`, `useRef`, `useMemo`, `useEffect`, `useField`) execute unconditionally at top level
    with zero early returns before JSX `return`.
  - `src/components/TaskListRow.tsx`: Refactored into `TaskListRow` (single unconditional `useEffortumStore` hook at line `31` prior to `if (!task) return null`
    at lines `33–35`) rendering `TaskListRowContent` (lines `40–350`), where all store selectors, `useState`, `useMemo`, `useEffect`, and `useField` hooks
    execute unconditionally with zero early returns.

### 6. Architecture Synchronization (`docs/architecture.md`)

- `docs/architecture.md` was updated accurately in **Runtime Structure** (Logic layer description) and **Key Constraints** to document MRU ordering across full
  IndexedDB task history in `AddEntryRow` and `TaskListRow` alongside alphabetical ordering in `ProjectsPage`, `TasksPage`, and `DeleteProjectModal`.
- `scripts/check-invariants.ts` required no changes (no new static layer/AST rule, no Dexie version bump, no new exception whitelist, no directory
  restructuring).

### 7. Formatting Verification (`pnpm prettier --check`)

- All 14 created and modified files for Issue #128 pass `pnpm prettier --check` cleanly. (7 untouched pre-existing repository files outside Issue #128 scope
  emit warnings under repository-wide `pnpm prettier --check .`.)

---

## Conclusion & Next Steps

All acceptance criteria and architectural invariants for Issue #128 are satisfied with zero violations. Branch `feature/issue-128` is verified and ready for
**Human Gate 2** review.
