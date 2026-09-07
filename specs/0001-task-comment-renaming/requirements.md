# Feature Requirements: Project Comments Update

## Overview
This feature allows users to update comments across multiple tasks within a project. Users can select a project and then update common comments for all tasks associated with that project.

## User Stories
1. As a user, I want to navigate to a "Tasks" page in the navigation menu
2. As a user, I want to select a project from a dropdown list
3. As a user, I want to see a list of unique comments for all tasks in the selected project
4. As a user, I want to edit each comment value and save changes
5. As a user, I want to be prevented from saving if there are other tasks with the same comment in the project

## Functional Requirements
1. Create a new "Tasks" page at the same level as "Projects" in navigation
2. Add project selection dropdown to the Tasks page
3. Display unique comments for all tasks in the selected project
4. Provide editable text field and save button for each comment
5. Validate that no other tasks have identical comments before saving
6. Update task comments in database with new values

## Non-Functional Requirements
1. Maintain consistency with existing UI patterns (Mantine components)
2. Follow existing codebase structure and naming conventions
3. Implement proper error handling and user feedback
4. Ensure performance with large datasets

## Acceptance Criteria
1. Navigation menu includes "Tasks" page option below "Projects"
2. Tasks page shows project selection dropdown
3. After selecting a project, unique comments are listed in rows with editable textboxes
4. Save button is disabled if a comment would create conflicts
5. Successful save updates all matching tasks and displays confirmation
6. All changes persist to IndexedDB through existing store patterns
7. Mantine UI components are used for layout

## API/Database Requirements
- Reuse existing Task model from db.ts
- Use existing store pattern for data operations
- No new database tables needed - reuse existing task comments field
