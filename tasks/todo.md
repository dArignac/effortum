# Tasks: Quick Start / Restart Task (Issue #224)

- [x] Task 1: Add Restart Task action in `src/components/TaskListRow.tsx`
  - Acceptance: A Play button (`IconPlayerPlay`) is added at the end of the actions column; clicking it restarts the task with current time (rounded if setting
    is enabled); button is hidden when any task is running.
  - Verify: TypeScript check passes, visual inspection.
  - Files: `src/components/TaskListRow.tsx`

- [x] Task 2: Ensure actions column width and no-wrap layout in `src/components/TaskList.tsx`
  - Acceptance: Buttons stay on a single line and do not wrap or cause layout shifts.
  - Verify: Sizing in table headers.
  - Files: `src/components/TaskList.tsx`

- [x] Task 3: Add E2E tests in `e2e/restart-task.spec.ts`
  - Acceptance: Tests verify restart functionality, hiding when task is active, rounding settings, and non-breaking layout.
  - Verify: `pnpm test:e2e` passes.
  - Files: `e2e/restart-task.spec.ts`

- [x] Task 4: Run unit tests and type checks
  - Acceptance: `pnpm test` and `pnpm exec tsc --noEmit` pass.
  - Verify: Clean test and tsc run.
  - Files: N/A

- [x] Task 5: Update `docs/architecture.md`
  - Acceptance: Document the restart task capability in `docs/architecture.md`.
  - Verify: Architecture doc reflects changes.
  - Files: `docs/architecture.md`

- [x] Task 6: Code formatting
  - Acceptance: All files formatted with Prettier according to `.prettierrc`.
  - Verify: `pnpm exec prettier --check .` passes.
  - Files: Modified files

- [ ] Task 7: Git commit, push branch, and create PR via Github MCP
  - Acceptance: Commit created, branch pushed, PR opened with requested title.
  - Verify: PR URL returned.
