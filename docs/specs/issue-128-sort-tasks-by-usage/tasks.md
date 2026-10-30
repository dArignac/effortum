# Tasks: Issue #128

- [x] Task 1: Add pure usage-recency sorting helpers (`usageSort.ts`)
  - Description: Create `src/utils/usageSort.ts` implementing `getTaskUsageTimestamp`, `sortProjectsByLastUsed`, and `sortCommentsByLastUsed` using `dayjs` (no
    raw `new Date()`). Used items sort descending by `(startMs, endMs)` where running tasks rank above completed tasks starting at the same minute; unused
    projects sort after used projects; ties break alphabetically via case-insensitive `localeCompare`. Create unit tests in `src/utils/usageSort.test.ts`.
  - Acceptance: Unit tests cover cross-date sorting, same-day chronological sorting, running tasks, unused projects, comment whitespace trimming/deduplication,
    legacy project name fallback, and deterministic tie-breaking.
  - Verify: `pnpm test src/utils/usageSort.test.ts && pnpm tsc --noEmit && pnpm check:invariants`
  - Files: [src/utils/usageSort.ts, src/utils/usageSort.test.ts]

- [x] Task 2: Add recent project and comment queries to `taskSlice`
  - Description: Add `getRecentProjectNames: () => Promise<string[]>` and `getRecentTaskCommentsForProject: (projectId: string) => Promise<string[]>` to
    `EffortumStore` in `src/store/types.ts` and implement them in `src/store/slices/taskSlice.ts` using `db.tasks` and the helpers from
    `src/utils/usageSort.ts`. Add unit tests in `src/store/slices/taskSlice.test.ts`.
  - Acceptance: `getRecentProjectNames` returns all store projects sorted by most recent task usage in `db.tasks`, and `getRecentTaskCommentsForProject` returns
    distinct comments for a `projectId` sorted by most recent usage in `db.tasks`. All unit tests pass.
  - Verify: `pnpm test src/store/slices/taskSlice.test.ts && pnpm tsc --noEmit && pnpm check:invariants`
  - Files: [src/store/types.ts, src/store/slices/taskSlice.ts, src/store/slices/taskSlice.test.ts]

- [x] Task 3: Wire last-used ordering into `TaskList`, `AddEntryRow`, and `TaskListRow`
  - Description: In `src/components/TaskList.tsx`, load `recentProjectNames` via `getRecentProjectNames` in a `useEffect` (placed above any conditional early
    return) triggered on `[projects, tasks, getRecentProjectNames]`, and pass `projectNames={recentProjectNames}` to `TaskListRow` and `AddEntryRow`. Update
    `src/components/AddEntry.tsx` and `src/components/TaskListRow.tsx` to use `projectNames` for the Project `Autocomplete` and
    `getRecentTaskCommentsForProject` for the Comment `Autocomplete`.
  - Acceptance: Both `AddEntryRow` and `TaskListRow` populate project and comment `Autocomplete` dropdowns in last-used order while preserving type-to-filter
    behavior, and existing unit/type/invariant checks pass.
  - Verify: `pnpm test && pnpm tsc --noEmit && pnpm check:invariants`
  - Files: [src/components/TaskList.tsx, src/components/AddEntry.tsx, src/components/TaskListRow.tsx]

- [x] Task 4: Add Playwright E2E suite (`e2e/issue-128.spec.ts`) and sync `docs/architecture.md`
  - Description: Create `e2e/issue-128.spec.ts` verifying last-used sorting of projects and comments in `AddEntryRow` and `TaskListRow`, dynamic re-ordering
    upon reusing an older project/comment, cross-date usage ordering on an empty day, and substring filtering by typing. Update `docs/architecture.md` to
    document MRU ordering in task-entry autocomplete dropdowns, and format changed files with Prettier.
  - Acceptance: `e2e/issue-128.spec.ts` and `e2e/task-autocomplete.spec.ts` pass headless, `docs/architecture.md` accurately reflects the behavior, and Prettier
    formatting passes.
  - Verify: `pnpm test:e2e e2e/issue-128.spec.ts e2e/task-autocomplete.spec.ts && pnpm prettier --check .`
  - Files: [e2e/issue-128.spec.ts, docs/architecture.md]
