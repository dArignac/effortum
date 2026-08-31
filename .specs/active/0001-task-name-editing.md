# Task Name Editing Feature

**Status:** In Progress
**Plan:** [0001-task-name-editing.plan.md](0001-task-name-editing.plan.md)

## 1. Summary

This specification describes a feature that allows users to edit task names directly within the Tasks navigation point. Users must first select a project from a dropdown, then see and edit tasks in-place. The save button becomes enabled when changes are made, allowing users to update all modified task names with a single click.

## 2. Goal and problem

The goal is to solve the problem of users not being able to easily rename tasks in the Tasks navigation point. Currently, users cannot modify task names directly, which reduces flexibility in organizing their time tracking data. This feature will allow users to update task names efficiently, improving data accuracy and user experience.

## 3. Users and roles

End users who need to track their work time and productivity. These are the primary users of the application who interact with the time tracking functionality.

## 4. Scope

### In scope
- Direct inline editing of task names in the Tasks section
- Project selection dropdown before viewing/editing tasks
- Save button that becomes enabled when changes are made
- Validation for duplicate task names within a project
- Validation to prevent empty task names
- Integration with existing Dexie database storage

### Out of scope
- Bulk editing of tasks (not now)
- Advanced task management features like dependencies, priorities, or due dates (not now)
- Task deletion functionality (not now)
- Exporting or importing tasks (not now)
- Multi-user permissions or access controls (not now)

## 5. Functional flow

1. User navigates to the Tasks section
2. User selects a project from the dropdown
3. User sees list of tasks for that project
4. User edits task names directly in the list
5. Save button becomes enabled when changes are made
6. User clicks save button to update all changed tasks
7. Changes are persisted to the database

## 6. Business rules

- Task names must be unique within a project
- Task names cannot be empty
- Task names cannot exceed the current database schema limits
- Renaming a task to a name that already exists in the project must be prohibited
- All data is stored locally in the browser's IndexedDB using Dexie

## 7. Functional requirements

- Users can select a project from a dropdown before viewing tasks
- Tasks are displayed in a list with editable names
- Direct inline editing of task names is supported
- Save button is enabled when any changes are made
- Changes are saved to the database when save button is clicked
- Validation messages display properly for invalid inputs

## 8. Data requirements

- Task name, project ID, and task ID are required data fields
- All data is stored locally in the browser's IndexedDB using Dexie
- Database operations must be handled through the state store only

## 9. UI/UX requirements

- Use existing Mantine components for consistency
- Project dropdown should be clearly labeled
- Task list should display with clear visual distinction between editable and non-editable elements
- Save button should have clear visual feedback when enabled
- Validation error messages should be displayed prominently
- Inline editing should provide proper focus management

## 10. Interfaces and integrations

- Integrates with Dexie database for local storage operations
- Uses TanStack Start architecture patterns
- Utilizes Mantine UI components for consistent design
- Accesses data from the state store only (no direct database access from components)

## 11. Security, permissions and privacy

- All data is stored locally in the browser's IndexedDB
- No external systems or APIs are involved
- No sensitive data is handled beyond user's own time tracking information
- No authentication or authorization required for this feature

## 12. Non-functional requirements

- Changes should be saved immediately when the save button is clicked
- Validation should occur in real-time as users edit
- UI should respond quickly to user interactions
- Database operations should not block the UI
- Error messages should be clear and actionable

## 13. Error cases and edge cases

- Duplicate task name validation: If a user tries to rename a task to a name that already exists in the project, an error message should display
- Empty name validation: If a user leaves a task name blank, an error message should display
- Database operation failures: If database operations fail, a generic error message should display
- Invalid character handling: Task names with special characters should be allowed as long as they don't exceed limits

## 14. Acceptance criteria

AC-001  The system shall allow users to select a project from a dropdown before viewing tasks.

AC-002  When a project is selected, the system shall display all tasks for that project in an editable list.

AC-003  While task names are being edited, the system shall enable the save button when changes are detected.

AC-004  If a user attempts to rename a task to a name that already exists in the project, then the system shall display a validation error message.

AC-005  When the save button is clicked, the system shall update all modified task names in the database.

## 15. Technical notes for developers or AI agents

- Must use Dexie for IndexedDB operations as per techContext.md
- Must follow TanStack Start architecture patterns
- Must utilize Mantine UI components for consistency
- Data access should be through the state store only (no direct database access from components)
- All data is stored locally in the browser's IndexedDB
- Task names must be validated before saving to prevent duplicates and empty values

## 16. Assumptions

| A-001 | The Tasks section already exists in the application |
|-------|------------------------------------------------------|
| A-002 | The project selection dropdown functionality is already implemented |
| A-003 | Task data is stored in a way that allows for efficient lookup by project ID |
| A-004 | The existing database schema supports task name updates |
| A-005 | Users are familiar with inline editing patterns |

## 17. Open points

- How should the validation error messages be displayed (toast notifications, inline, etc.)?
- What is the maximum length allowed for task names in the database schema?
- Should there be a confirmation dialog when saving changes?
- What specific validation rules will be applied to task names, and how will they be enforced during editing?
- How will the system handle cases where the Tasks section doesn't exist yet or needs to be created?
- What is the current database structure for task management and how does it support project-based lookups?

## 18. Definition of Ready

The spec is ready when:
- Goal and problem are unambiguous
- User role and business value are clear
- Scope and out-of-scope are documented
- Business rules are testable
- At least the happy path is described
- Relevant edge cases are described or deliberately left out
- Acceptance criteria are measurable
- Data, permissions and constraints are clarified or marked as assumptions
- Open questions are visible

## 19. Definition of Done

Implementation is done when:
- All must-requirements are built
- All acceptance criteria pass
- Tests were added and run green
- No out-of-scope functionality was added
- Security and privacy requirements are met
- Error handling and relevant logging exist
- Assumptions were verified or documented
- Docs plus the architecture snapshot were updated where needed
- The user accepted the result

## 20. Recommended next steps

1. Run `/sdd-clarify` to review this specification for any missing elements
2. Run `/sdd-plan` to create a detailed implementation plan
3. Implement the feature following the plan
4. Test the implementation against all acceptance criteria