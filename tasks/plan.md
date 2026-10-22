# Implementation Plan: Quick Start / Restart Task (Issue #224)

## Architecture & Dependencies

- Component: `src/components/TaskListRow.tsx`
  - Needs `addTask`, `tasks` (to check `tasks.some(isRunningTask)`), `projects`, `roundToNearest5Minutes`, `setEndTimeOfLastStoppedTask`.
  - Icon: `IconPlayerPlay` from `@tabler/icons-react`.
  - UI Layout: Wrap actions cell contents in Mantine `<Group gap={4} wrap="nowrap">` to guarantee buttons never break onto multiple lines.
- Component: `src/components/TaskList.tsx`
  - Adjust Actions column width if needed (e.g. `w={100}`) to comfortably house two actions on a single line.
- Tests:
  - Unit tests: check store or component if applicable.
  - E2E tests: `e2e/restart-task.spec.ts` testing the end-to-end workflow in Playwright.

## Implementation Steps

1. Task 1: Update `TaskListRow.tsx` to add `handleRestartTask`, `IconPlayerPlay`, and `<Group wrap="nowrap">`.
2. Task 2: Ensure table column sizing in `TaskList.tsx` supports actions without breaking.
3. Task 3: Write comprehensive E2E tests in `e2e/restart-task.spec.ts`.
4. Task 4: Run unit tests, type checks, and E2E tests.
5. Task 5: Update `docs/architecture.md` to document the restart task capability.
6. Task 6: Format codebase with Prettier.
7. Task 7: Commit, push to branch `224-add-quick-start-button`, and create PR.
