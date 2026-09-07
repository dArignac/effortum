# Feature Design: Project Comments Update

## Architecture Overview
This feature extends the existing time tracking application by adding a new "Tasks" page that allows users to update comments for multiple tasks within a project. The implementation follows the established patterns of the existing codebase.

## Implementation Plan

### 1. Page Component Structure
- Create `TasksPage.tsx` in `src/pages/` directory
- Add "Tasks" link to navigation menu in `src/components/Navigation.tsx`
- Implement page layout similar to existing projects page

### 2. Data Flow
1. User selects project from dropdown
2. Backend retrieves all tasks for selected project
3. Extract unique comments from tasks
4. Display each unique comment in editable row
5. On save:
   - Validate that no other tasks would have duplicate comments
   - Update all matching tasks with new comment value
   - Handle validation errors gracefully

### 3. Database Interface
- Utilize existing `db.tasks` table methods
- Use existing `useEffortumStore` for state management
- Apply update operations through the established store patterns

### 4. UI Components
- Project selection dropdown using existing Mantine components
- Grid layout matching ProjectsPage.tsx design pattern
- Editable comment rows with text input and save buttons
- Validation error display for conflict handling

## Technical Implementation Details

### File Structure
```
src/
├── pages/
│   └── TasksPage.tsx          # New page component
├── components/
│   └── CommentUpdateForm.tsx  # Reusable form component
└── routes/
    └── tasks.route.ts         # Route definition (if needed)
```

### Component Logic Flow
1. Project selection triggers data fetch from store
2. For selected project, get all tasks and extract unique comments
3. Display comments in editable rows:
   - Row contains comment text input
   - Save button for each row
   - Conflict validation before save
4. Save operation updates matching tasks in database

### State Management
- Use existing `useEffortumStore` for project and task data access
- Maintain local form state for comment edits
- Handle loading state during data operations
- Provide user feedback on success/failure

### Validation Logic
1. When user attempts to save:
   - Get all tasks in project (including unmodified ones)
   - Check if new comment value already exists for any other task
   - Show validation error if conflict detected
   - Proceed with update if no conflicts found

### Database Operations
- Use existing store methods for data access
- Apply database updates through established `db.tasks.update()` pattern
- Ensure all changes are persisted using IndexedDB via Dexie.js

## UI Mockup
```
[Project: Select Project]  ← Dropdown to select project

Comment Update Table:
┌──────────────────────────────────────┬─────────┐
│ Comment Text                         │ Save    │
├──────────────────────────────────────┼─────────┤
│ "Meeting with client"                │ [Save]  │
│ "Code review"                        │ [Save]  │
│ "Documentation update"               │ [Save]  │
└──────────────────────────────────────┴─────────┘
```

## Performance Considerations
1. Implement efficient database queries for tasks by project
2. Cache project data to prevent redundant fetches
3. Use existing pagination or filtering where applicable
4. Handle large datasets gracefully

## Testing Strategy
1. Unit tests for comment extraction logic
2. Integration tests for save operations
3. Validation error handling tests
4. Page navigation and component rendering tests

## Dependencies
- Uses existing Mantine UI components
- Leverages existing `useEffortumStore` pattern
- Reuses existing database connection (`db.ts`)
- Follows existing project structure conventions
