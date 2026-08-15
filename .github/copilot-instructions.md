# Copilot Instructions for Effortum

## Project Context

- Effortum is a local-first time tracker.
- Primary stack: TanStack Start, React, TypeScript, Vite, Mantine.
- State and persistence: Zustand store + Dexie (IndexedDB).
- Date/time logic relies on dayjs utilities.

## Code Style and Structure

- Follow existing patterns before introducing new abstractions.
- Prefer named exports for components and utilities, consistent with the current codebase.
- Keep changes focused and minimal; avoid unrelated refactors.
- Preserve existing file organization: `components`, `pages`, `routes`, `utils`, `models`.

## State, Data, and Domain Rules

- Use the centralized store in `src/store.ts` for app state updates.
- Keep async persistence flow aligned with existing store actions (read/write via Dexie, then update store state).
- Maintain local-first behavior. Do not add server/database dependencies unless explicitly requested.
- Preserve project/task/comment/overtime model shapes unless a task explicitly requires schema changes.

## Date and Filtering Behavior

- Keep date comparisons day-based where expected.
- Normalize date-only and ISO datetime inputs before day-level comparisons.
- Preserve inclusive date-range filtering behavior in existing utilities unless requirements change.

## UI and Validation

- Use Mantine components and current interaction patterns.
- Keep validation-first form behavior (validate fields before creating/updating entries).
- Preserve existing `data-testid` conventions for testability.
- Target UI elements only by using their `data-testid` attributes in tests.

## Routing and Generated Files

- Use TanStack Router patterns already in use.
- Do not manually edit generated files such as `src/routeTree.gen.ts`; regenerate through project tooling when needed.

## Testing Expectations

- For logic changes in `src/utils`, add or update Vitest unit tests.
- For user-flow changes, add or update Playwright e2e tests when appropriate.
- Validate behavior with existing scripts:
  - `pnpm test`
  - `pnpm test:e2e`

## Editing Guardrails

- Do not break current local storage/indexeddb data assumptions.
- Avoid broad dependency changes unless necessary for the requested task.
- Keep public behavior stable unless the user asks for a behavior change.

## Collaboration Preferences

- If requirements are ambiguous, prefer the simplest solution consistent with current patterns.
- Include concise comments only when logic is non-obvious.

## Documentation Maintenance

- Keep architecture and technical docs in `docs/` up to date with code changes.
- When entities, store flow, persistence, routing, or core behavior change, update affected files in `docs/` in the same task.
- Keep docs concise, specific, and aligned with the implemented behavior.
