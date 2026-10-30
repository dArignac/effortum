# Plan: feat: Sort tasks by usage (#128)

## 1. Component Dependency Graph

```text
[src/utils/usageSort.ts]  (Pure dayjs MRU sorting: sortProjectsByLastUsed, sortCommentsByLastUsed)
          │
          ▼
[src/store/slices/taskSlice.ts] & [src/store/types.ts]
  ├── getRecentProjectNames() -> queries db.tasks.toArray() + get().projects
  └── getRecentTaskCommentsForProject(projectId) -> queries db.tasks.where("projectId").equals(projectId)
          │
          ▼
[src/components/TaskList.tsx]
  ├── Loads recentProjectNames once on [projects, tasks] updates
  ├── Passes projectNames ──► [src/components/AddEntry.tsx] (also calls getRecentTaskCommentsForProject)
  └── Passes projectNames ──► [src/components/TaskListRow.tsx] (also calls getRecentTaskCommentsForProject)
          │
          ▼
[Verification & Docs]
  ├── src/utils/usageSort.test.ts
  ├── src/store/slices/taskSlice.test.ts
  ├── e2e/issue-128.spec.ts
  └── docs/architecture.md
```

## 2. Implementation Order

1. **Pure Sorting Foundation (`src/utils/usageSort.ts` & `src/utils/usageSort.test.ts`):**
   - Implement `getTaskUsageTimestamp(task)` using `dayjs` (`startMs` from `${task.date}T${task.timeStart}`, `endMs` as `Number.MAX_SAFE_INTEGER` when `timeEnd`
     is empty/running or `${task.date}T${task.timeEnd}` when completed).
   - Implement `sortProjectsByLastUsed(projects, tasks)` returning `string[]` of project names ordered by latest `(startMs, endMs)` descending, with unused
     projects placed after used projects and alphabetical tie-breaking (`localeCompare` with `{ sensitivity: "base" }`).
   - Implement `sortCommentsByLastUsed(tasks)` returning deduplicated non-empty trimmed `string[]` ordered by latest `(startMs, endMs)` descending with
     alphabetical tie-breaking.
   - Verify thoroughly with unit tests in `src/utils/usageSort.test.ts`.

2. **Store Slice Integration (`src/store/types.ts`, `src/store/slices/taskSlice.ts`, `src/store/slices/taskSlice.test.ts`):**
   - Extend `EffortumStore` interface with `getRecentProjectNames` and `getRecentTaskCommentsForProject`.
   - Implement both methods in `createTaskSlice` querying `db.tasks` so usage history spans all dates in IndexedDB even when `state.tasks` only holds the
     currently selected calendar date range.
   - Add unit tests in `src/store/slices/taskSlice.test.ts`.

3. **UI Wiring (`src/components/TaskList.tsx`, `src/components/AddEntry.tsx`, `src/components/TaskListRow.tsx`):**
   - In `TaskList.tsx`, fetch `recentProjectNames` via `useEffect` (placed above the `if (isDataLoading)` early return to preserve hook order) whenever
     `projects` or `tasks` updates, and pass `projectNames={recentProjectNames}` to `AddEntryRow` and `TaskListRow`.
   - In `AddEntry.tsx`, accept `props: { projectNames?: string[] }` (falling back to `projects.map((p) => p.name)`) and switch comment loading from
     `getUniqueTaskCommentsForProject` to `getRecentTaskCommentsForProject`.
   - In `TaskListRow.tsx`, accept `props: { taskId: string | null; projectNames?: string[] }` and load `availableComments` asynchronously via `useEffect`
     calling `getRecentTaskCommentsForProject(project.id)` on `[selectedProjectName, projects, tasks]` changes.

4. **End-to-End Verification & Documentation (`e2e/issue-128.spec.ts`, `docs/architecture.md`):**
   - Add Playwright E2E suite `e2e/issue-128.spec.ts` testing:
     - Project autocomplete shows most recently used projects first and updates order when an older project is used again.
     - Comment autocomplete shows most recently used comments first for the selected project and updates order when an older comment is reused.
     - Cross-date persistence: tasks logged on an earlier date still govern project and comment dropdown order when viewing a date with zero tasks.
     - Typing into project and comment inputs filters suggestions by substring while preserving MRU order among matches.
     - Existing task row (`TaskListRow`) project and comment dropdowns also list options in last-used order.
   - Update `docs/architecture.md` to document MRU sorting in task-entry autocomplete dropdowns.

## 3. Risks & Mitigations

- **Risk 1: `state.tasks` only holds lazy-loaded tasks for the active calendar range (empty on a new day).**
  - **Mitigation:** `getRecentProjectNames` and `getRecentTaskCommentsForProject` query `db.tasks` in IndexedDB via the store slice rather than relying solely
    on `state.tasks`, ensuring 2+ months of historical usage are always reflected on startup.
- **Risk 2: Random UUID primary keys in `db.tasks` (`crypto.randomUUID()`) produce arbitrary `toArray()` order.**
  - **Mitigation:** Never rely on array iteration order for recency; compute explicit `dayjs` timestamps `(startMs, endMs)` and apply deterministic
    case-insensitive alphabetical tie-breaking.
- **Risk 3: N+1 IndexedDB scans if every `TaskListRow` independently queries `db.tasks.toArray()` for project order.**
  - **Mitigation:** Lift `getRecentProjectNames()` to a single `useEffect` in `TaskList.tsx` and pass `projectNames` as a prop to `TaskListRow` and
    `AddEntryRow`.
- **Risk 4: Regression in management views (`ProjectsPage`, `TasksPage`, `DeleteProjectModal`).**
  - **Mitigation:** Keep `getUniqueTaskCommentsForProject` and `state.projects` alphabetical contracts untouched so `e2e/projects.spec.ts` and
    `e2e/tasks.spec.ts` remain green without modification.

## 4. Verification Checkpoints

- Checkpoint 1: `pnpm test src/utils/usageSort.test.ts` passes, `pnpm tsc --noEmit` and `pnpm check:invariants` pass.
- Checkpoint 2: `pnpm test src/store/slices/taskSlice.test.ts` passes, `pnpm tsc --noEmit` and `pnpm check:invariants` pass.
- Checkpoint 3: UI components compile cleanly (`pnpm tsc --noEmit`), invariants hold (`pnpm check:invariants`), and existing autocomplete E2E tests pass
  (`pnpm test:e2e e2e/task-autocomplete.spec.ts`).
- Checkpoint 4: Full E2E test suite (`pnpm test:e2e`), unit tests (`pnpm test`), invariants (`pnpm check:invariants`), and Prettier (`pnpm prettier --check .`)
  pass.
