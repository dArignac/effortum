# Development Tasks: Project Comments Update Feature

## Task Breakdown

### 1. Set Up New Page Component
- [ ] Create `src/pages/TasksPage.tsx` with basic structure
- [ ] Implement project selection dropdown using existing components
- [ ] Add layout matching ProjectsPage.tsx design

### 2. Implement Comment Display Logic
- [ ] Fetch tasks for selected project from store
- [ ] Extract unique comments from tasks
- [ ] Create rows for each unique comment with editable text inputs
- [ ] Add save button to each row

### 3. Implement Save Functionality
- [ ] Validate that saving would not create duplicate comments
- [ ] Update matching tasks in database
- [ ] Handle validation errors gracefully
- [ ] Provide user feedback on success/failure

### 4. Integrate into Navigation
- [ ] Add "Tasks" link to navigation menu
- [ ] Ensure proper routing
- [ ] Test page accessibility from navigation

### 5. Testing and Validation
- [ ] Unit tests for comment extraction logic
- [ ] Integration tests for save operations
- [ ] Test validation error handling
- [ ] End-to-end test of full workflow

## Implementation Details

### File: `src/pages/TasksPage.tsx`
- Create new page component with project dropdown
- Implement task loading and comment extraction logic
- Design layout with comment rows matching existing patterns

### File: `src/components/CommentUpdateForm.tsx` (Optional)
- Reusable component for comment editing form
- Could be used to extract comment row rendering logic

### Database Interaction
- Use existing query methods from `useEffortumStore`
- Apply database updates through established patterns
- Follow existing error handling approaches

## Success Criteria
- New "Tasks" page accessible through navigation
- Project selector works correctly
- Unique comments displayed in editable rows
- Validation prevents duplicate comment conflicts
- Changes save successfully to database
- User receives appropriate feedback for all operations
- All existing functionality remains intact
