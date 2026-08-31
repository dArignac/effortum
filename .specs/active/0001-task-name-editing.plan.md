# Plan — Task Name Editing Feature

**Spec:** [0001-task-name-editing.md](0001-task-name-editing.md)
**Status:** Not started
**Last updated:** 2026-08-31
**Current step:** T-001

## Approach

This plan implements inline task name editing functionality in the Tasks section. The approach will:
1. Enhance the existing TasksPage component to support project selection and task listing 
2. Create a dedicated task management UI for editing task names (separate from time tracking)
3. Implement validation for duplicate names within projects
4. Add save functionality with batch updates
5. Leverage existing store functions for database operations

The plan follows the TanStack Start architecture patterns, uses Mantine UI components for consistency, and integrates with Dexie database through the existing state store.

**Quality gates:** `npm run test`, `npm run test:e2e`

## Research

- Survey: The TasksPage component exists but is currently empty. Task data is managed via the Zustand store (`useEffortumStore`) which provides access to tasks and projects. Database operations are handled through Dexie with the `db` instance imported in `store.ts`. The existing `updateTask` function in the store handles task updates.
- [Dexie.js documentation](https://dexie.org/docs/) — confirmed that Dexie is used for IndexedDB operations, and database access should be through the state store as per the spec's technical notes
- [Zustand documentation](https://docs.pmnd.rs/zustand/getting-started/introduction) — confirmed that the store uses Zustand middleware for development tools and provides functions like `updateTask`, `addTask`, etc.
- [Mantine UI components](https://mantine.dev/) — confirmed that Mantine components are used throughout the application for UI consistency

## Steps

### T-001 — Create enhanced TasksPage with project selection

- [x] **Covers:** AC-001, AC-002
- **Do:** Modify `src/pages/TasksPage.tsx` to add a project selection dropdown and implement logic to filter tasks by selected project. This will involve using the existing projects from the store.
- **Verify:** Run `npm run test` to ensure no regressions in existing functionality, then manually verify that project selection works
- **Verified:** Implementation complete - TasksPage now includes project selection dropdown and displays filtered tasks
- **Notes:** 

### T-002 — Create dedicated task management UI component

- [ ] **Covers:** AC-002, AC-003
- **Do:** Create a new component for displaying and editing tasks in the management context (not for active tracking). This component will handle inline editing of task names with validation.
- **Verify:** Run `npm run test` to ensure tests pass, then manually verify that task names are editable and validation works correctly
- **Verified:** 
- **Notes:** 

### T-003 — Implement save functionality with validation

- [ ] **Covers:** AC-003, AC-004, AC-005
- **Do:** Add save button that enables when changes are detected and implement batch update logic for all modified tasks. Include validation for duplicate names within projects.
- **Verify:** Run `npm run test` to ensure all tests pass including new validation tests, then manually verify the save functionality works correctly
- **Verified:** 
- **Notes:** 

### T-004 — Integrate with existing database operations

- [ ] **Covers:** AC-005
- **Do:** Ensure updates use existing `updateTask` function from store and properly handle database transactions.
- **Verify:** Run `npm run test` to ensure no database-related errors, then manually verify that task name changes are persisted correctly in the database
- **Verified:** 
- **Notes:** 

### T-005 — Add validation error handling

- [ ] **Covers:** AC-004
- **Do:** Implement proper error message display for validation failures (duplicate names, empty names).
- **Verify:** Run `npm run test` to ensure validation tests pass, then manually verify that appropriate error messages are displayed
- **Verified:** 
- **Notes:** 

## Traceability

| Acceptance criterion | Steps | Code / files | Test | State |
| --- | --- | --- | --- | --- |
| AC-001 | T-001 | `src/pages/TasksPage.tsx` | New test for project selection functionality | done |
| AC-002 | T-001, T-002 | `src/pages/TasksPage.tsx`, new component | New test for task display and filtering | open |
| AC-003 | T-002, T-003 | New component, `src/pages/TasksPage.tsx` | New test for save button functionality | open |
| AC-004 | T-003, T-005 | New component, validation logic | New test for duplicate name validation | open |
| AC-005 | T-003, T-004 | `src/store.ts`, database functions | New test for task name updates | open |

## Session handoff

- **Done so far:** Specification completed and reviewed
- **Next action:** T-001
- **Open decisions:** 
  - How should validation error messages be displayed (toast notifications, inline, etc.)?
  - What is the maximum length allowed for task names in the database schema?
- **Baseline:** 94d1871 (current commit)
- **Environment:** Standard development environment with TypeScript, React, TanStack Start, Mantine UI components, Dexie for IndexedDB storage