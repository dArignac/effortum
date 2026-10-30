# Spec: feat: Sort tasks by usage (#128)

## Objective

When adding or editing time tracking entries (`AddEntryRow` and `TaskListRow`), sort the options in both the **Project** autocomplete dropdown and the
**Comment** autocomplete dropdown by **most recently used first** ("last used") across persisted task history rather than purely alphabetically. Users typically
work on the same projects and task comments repeatedly over weeks or months; showing the most recently used items at the top speeds up task entry while still
allowing users to filter the dropdown list by typing any substring.

## Acceptance Criteria

1. **Project Autocomplete Ordering (`AddEntryRow` & `TaskListRow`):**
   - Projects used in persisted tasks appear before projects that have never been used in any task.
   - Used projects are ordered descending by the timestamp of their most recent task across all persisted tasks in IndexedDB (not restricted to the currently
     selected calendar date range).
   - Projects with zero tasks appear after used projects, ordered alphabetically (case-insensitive `localeCompare` with `{ sensitivity: "base" }`).
   - When two projects share the exact same latest usage timestamp, ties are broken deterministically in alphabetical order.
   - Project renames preserve usage history via canonical `task.projectId` matching (with legacy `task.project` name fallback if `projectId` is absent).

2. **Comment Autocomplete Ordering (`AddEntryRow` & `TaskListRow`):**
   - For the currently selected project, distinct non-empty trimmed comments across all persisted tasks of that project in IndexedDB are ordered descending by
     the timestamp of their most recent task in that project.
   - Empty or whitespace-only comments are excluded, and leading/trailing whitespace is trimmed prior to deduplication.
   - When two distinct comments share the exact same latest usage timestamp, ties are broken deterministically in alphabetical order (case-insensitive
     `localeCompare` with `{ sensitivity: "base" }`).

3. **Task Usage Recency Calculation:**
   - Recency of a task is determined using `dayjs` from `task.date` (`YYYY-MM-DD`) and `task.timeStart` (`HH:mm`) as primary timestamp (`startMs`).
   - If two tasks have the identical `date` and `timeStart`, `endMs` breaks ties: an active/running task (`!task.timeEnd || task.timeEnd.trim() === ""`) ranks
     ahead of completed tasks starting at the same minute, and otherwise higher `dayjs(`${task.date}T${task.timeEnd}`).valueOf()` ranks first.

4. **Filtering by Typing Preserved:**
   - Typing into either the Project or Comment `Autocomplete` input continues to filter matching options case-insensitively by substring while preserving the
     most-recently-used relative order among matching options.

5. **Management Views Unchanged:**
   - Administrative/management views (`ProjectsPage`, `TasksPage`, and `DeleteProjectModal`) retain their existing alphabetical ordering.

## Tech Stack

- TypeScript
- React 19
- Mantine UI (`Autocomplete`)
- Zustand
- Dexie.js (IndexedDB)
- Dayjs
- Vitest & Playwright

## Commands

- Run invariant checks: `pnpm check:invariants`
- Run unit tests: `pnpm test`
- Run E2E tests: `pnpm test:e2e`
- Typecheck: `pnpm tsc --noEmit`
- Format check: `pnpm prettier --check .`

## Project Structure

Files to be created or modified:

- `src/utils/usageSort.ts` _(new)_: Pure `dayjs`-based helpers `sortProjectsByLastUsed` and `sortCommentsByLastUsed` computing deterministic MRU order with
  alphabetical fallback/tie-breaking.
- `src/utils/usageSort.test.ts` _(new)_: Unit tests covering cross-date ordering, same-day chronological ordering, running tasks, unused projects, whitespace
  trimming/deduplication, and tie-breaking.
- `src/store/types.ts`: Add `getRecentProjectNames: () => Promise<string[]>` and `getRecentTaskCommentsForProject: (projectId: string) => Promise<string[]>` to
  `EffortumStore`.
- `src/store/slices/taskSlice.ts`: Implement `getRecentProjectNames` and `getRecentTaskCommentsForProject` querying IndexedDB via `db.tasks` and delegating to
  `usageSort.ts`.
- `src/store/slices/taskSlice.test.ts`: Unit tests verifying `getRecentProjectNames` and `getRecentTaskCommentsForProject` store slice behavior.
- `src/components/TaskList.tsx`: Fetch `recentProjectNames` once via `getRecentProjectNames` when `projects` or `tasks` change and pass `projectNames` down to
  `TaskListRow` and `AddEntryRow` to avoid N+1 IndexedDB queries across rows.
- `src/components/AddEntry.tsx`: Accept optional `projectNames` prop for the Project `Autocomplete` and use `getRecentTaskCommentsForProject` for the Comment
  `Autocomplete`.
- `src/components/TaskListRow.tsx`: Accept optional `projectNames` prop for the Project `Autocomplete` and load `availableComments` via
  `getRecentTaskCommentsForProject` so row editing also benefits from full cross-date comment history ordered by last used.
- `e2e/issue-128.spec.ts` _(new)_: End-to-end Playwright tests verifying last-used ordering of projects and comments, dynamic re-ordering when older items are
  reused, cross-date persistence when viewing an empty day, row editing dropdowns, and substring filtering by typing.
- `docs/architecture.md`: Update runtime/key-constraints notes to document MRU ordering in task-entry autocomplete dropdowns vs. alphabetical ordering in
  management pages.

## Effortum Architectural Guard

- **Dexie Schema Migration:** No. `db.tasks` already stores `date`, `timeStart`, `timeEnd`, `projectId`, `project`, and `comment`, with `projectId` indexed in
  version 7. No schema changes or migrations are required.
- **Store Slice Boundaries:** Only `src/store/slices/taskSlice.ts` (and `src/store/types.ts`) is modified in the store layer. UI components (`TaskList.tsx`,
  `AddEntry.tsx`, `TaskListRow.tsx`) access IndexedDB exclusively through `useEffortumStore` methods (`getRecentProjectNames` and
  `getRecentTaskCommentsForProject`). Existing methods (`getUniqueTaskCommentsForProject`, `getCommentsForProject`) remain intact for management views.
- **Date & Time Operations:** All date/time parsing in `src/utils/usageSort.ts` strictly uses `dayjs`. Zero raw `new Date()` calls.
- **Single Running Task Invariant:** Unaffected. Does not alter task creation, stopping, restarting, or active-task validation rules.
- **Testing Requirements:**
  - Unit tests in `src/utils/usageSort.test.ts` and `src/store/slices/taskSlice.test.ts`.
  - Playwright E2E tests in `e2e/issue-128.spec.ts` plus full regression pass across existing E2E suites (`e2e/task-autocomplete.spec.ts`,
    `e2e/projects.spec.ts`, `e2e/tasks.spec.ts`).

## Boundaries

- Always: Run `pnpm check:invariants`, write tests alongside code, format with Prettier.
- Ask first: Schema changes, new dependencies, deleting existing tests.
- Never: Direct Dexie imports in UI, naked `new Date()`, `@ts-ignore`, `test.skip`.

## Success Criteria

1. Project dropdowns in `AddEntryRow` and `TaskListRow` display projects ordered from most recently used to least recently used across full IndexedDB history,
   with unused projects appended alphabetically.
2. Comment dropdowns in `AddEntryRow` and `TaskListRow` display project-scoped comments ordered from most recently used to least recently used across full
   IndexedDB history.
3. Typing in either dropdown filters options by substring while maintaining most-recently-used ordering among matches.
4. `ProjectsPage`, `TasksPage`, and `DeleteProjectModal` continue to display projects and comments in alphabetical order.
5. `pnpm check:invariants`, `pnpm tsc --noEmit`, `pnpm test`, `pnpm test:e2e`, and `pnpm prettier --check .` all exit with code 0.
