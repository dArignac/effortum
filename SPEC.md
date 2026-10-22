# Spec: Quick Start / Restart Task Action (Issue #224)

## Objective

Provide a quick action "Play" button in the actions column of each task row in `TaskListRow` to allow users to immediately restart any previously logged task
with the current time. This eliminates manual project and comment re-entry when resuming work on an existing task.

### Acceptance Criteria

1. Each task row displays a "Play" button (Tabler icon `player-play`) in the actions column.
2. The button is placed as the last button in the actions column row.
3. The button is hidden whenever any active running task exists (whether on the current date or outside the current date range).
4. Clicking the button creates and starts a new task with:
   - `date`: Current date (`YYYY-MM-DD` via `dayjs`).
   - `timeStart`: Current time (`HH:mm`), rounded to the nearest 5 minutes if the "round times to nearest 5 minutes" setting is enabled.
   - `timeEnd`: Empty string `""` (marking it as an active running task).
   - `projectId`: Same project ID as the target task.
   - `projectName`: Same project name as the target task.
   - `comment`: Same comment as the target task.
5. Action buttons in the actions column must stay on a single line without wrapping.
6. A success notification is shown upon starting the task, or an error notification if the operation fails.

## Tech Stack

- Framework: TanStack Start with Nitro, React 19, TypeScript
- State Management: Zustand (with slices pattern)
- UI Library: Mantine UI v9, `@tabler/icons-react`
- Persistence: IndexedDB via Dexie.js
- Testing: Vitest (unit/component), Playwright (E2E)
- Utilities: Day.js for date and time calculations

## Commands

```bash
# Development server
pnpm dev

# Type check
pnpm exec tsc --noEmit

# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Format check / format
pnpm exec prettier --write .
```

## Project Structure

```
src/
  components/
    TaskList.tsx       # Table headers, widths, active task alert
    TaskListRow.tsx    # Row component containing the actions column and Play button
  store/
    slices/
      taskSlice.ts     # Task CRUD, active task enforcement
  utils/
    time.ts            # Time calculations and rounding utilities
e2e/
  restart-task.spec.ts # End-to-end tests for restarting tasks
```

## Code Style

```tsx
<Group gap={4} wrap="nowrap">
  <ActionIcon
    variant="default"
    size="md"
    aria-label="Update Task"
    mt={1}
    onClick={updateEntry}
    disabled={!hasChanges}
    data-testid={`button-update-task-${task.id}`}
  >
    <IconPencilCheck />
  </ActionIcon>
  {canStopTask && (
    <ActionIcon variant="light" size="md" aria-label="Stop Task" onClick={stopTask} data-testid={`button-stop-task-${task.id}`}>
      <IconClockPause />
    </ActionIcon>
  )}
  {!hasRunningTask && (
    <ActionIcon variant="subtle" size="md" aria-label="Restart Task" onClick={handleRestartTask} data-testid={`button-restart-task-${task.id}`}>
      <IconPlayerPlay />
    </ActionIcon>
  )}
</Group>
```

- Mantine components only; no raw HTML buttons.
- Functional React components with hooks.
- Day.js for all datetime manipulation.

## Testing Strategy

1. **Unit tests (`vitest`)**:
   - Verify rounding behavior and active task constraints in store / utility functions.
2. **E2E tests (`playwright`)**:
   - `e2e/restart-task.spec.ts`:
     - Verify Play button is visible when no tasks are running.
     - Verify clicking Play button starts a new running task with matching project and comment.
     - Verify Play button is hidden when any task is running.
     - Verify rounding setting is respected (both enabled and disabled).
     - Verify Action buttons stay on one line without breaking.

## Boundaries

- **Always**:
  - Use Mantine components (`ActionIcon`, `Group`).
  - Use `dayjs` for all date and time logic.
  - Enforce single active task constraint.
  - Run type checks and tests before submitting.
- **Ask first**:
  - Modifying database schema or table structures.
  - Adding new dependencies.
- **Never**:
  - Bypass Zustand store to write directly to Dexie DB from UI components.
  - Allow more than one active task to run simultaneously.

## Assumptions

1. When restarting a task, the newly started task is created with the current local date (`dayjs().format("YYYY-MM-DD")`).
2. Current time is rounded to the nearest 5 minutes if and only if `roundToNearest5Minutes` in settings is `true`.
3. The Play button is hidden on all rows if any task in the entire store is running.
4. Button order is: Update Task, Stop Task (if running), Play/Restart Task.

## Success Criteria

- [x] Branch `224-add-quick-start-button` is checked out and used.
- [ ] Tabler icon `player-play` is displayed as the last button in the actions column.
- [ ] Play button does not appear if any task is currently running.
- [ ] Clicking Play creates a new active task with today's date, current start time (rounded if setting is enabled), no end time, and identical project/comment.
- [ ] All action buttons remain on a single line without wrapping.
- [ ] All unit and E2E tests pass.
- [ ] Architecture documentation in `docs/architecture.md` is updated if applicable.
- [ ] Code formatted with Prettier.
- [ ] Branch pushed to origin and PR created with requested title.
