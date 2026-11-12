# Spec: tests: rename e2e files (#277)

## Objective

Several End-to-End (E2E) test files in `e2e/` are currently named with issue numbers (`issue-XXX.spec.ts`) rather than functional capability names describing
what they test. In accordance with the repository's convention and issue #277, all E2E test files must be named according to the main functionality and
capability they are testing.

Additionally, repository guidelines and autonomous agent prompt templates in `AGENTS.md` and `.agents/` must be updated so future implementations naturally
adopt functional E2E test naming (`e2e/<functional-name>.spec.ts`) rather than the legacy pattern `e2e/issue-<id>.spec.ts`.

## Tech Stack

- TypeScript
- Playwright (`@playwright/test`)
- Vite test runner / webServer (`pnpm dev:alt`)

## Commands

- Run invariant checks: `pnpm check:invariants`
- Run unit tests: `pnpm test`
- Run E2E tests: `pnpm test:e2e`
- Typecheck: `pnpm tsc --noEmit`
- Format check: `pnpm prettier --check .`

## File Mappings & Renaming Plan

The four existing issue-named E2E test files will be renamed using `git mv` to preserve git file history:

1. **`e2e/issue-51.spec.ts` ➔ `e2e/task-manual-add-prefill.spec.ts`**
   - **Capability:** Prefilling the `start` input with the just-added task's `end` time on manual task creation, chaining across consecutive manual entries,
     5-minute rounding interaction, and state isolation when an active task is running.
   - **Companion file:** Complements `e2e/task-stop-start-prefill.spec.ts` (which tests prefill behavior when stopping an active timer).
   - **Describe heading:** Update suite title from `"Prefill start time on manual finished task addition (#51)"` to
     `"Prefill start time on manual finished task addition"`.

2. **`e2e/issue-128.spec.ts` ➔ `e2e/task-autocomplete-sorting.spec.ts`**
   - **Capability:** Autocomplete dropdown ordering for projects and comments based on most recent usage ("last used") across task history, updating dynamically
     when older items are reused, cross-date persistence, and substring filtering.
   - **Companion file:** Complements `e2e/task-autocomplete.spec.ts` (which tests basic project and comment suggestion population).
   - **Describe heading:** Update suite title from `"Issue #128: Sort tasks by usage (last used)"` to `"Task autocomplete sorting by last used"`.

3. **`e2e/issue-129.spec.ts` ➔ `e2e/summary-project-allocation.spec.ts`**
   - **Capability:** Calculation, formatting (`X%`), and display of spent time per project in percent (project allocation) in the summary table, multi-line
     vertical top-alignment, list-by-task mode, and footer exclusion.
   - **Describe heading:** Update suite title from `"Issue #129: Show spent time per project in percent"` to `"Summary project allocation percentages"`.

4. **`e2e/issue-241.spec.ts` ➔ `e2e/summary-project-allocation-toggle.spec.ts`**
   - **Capability:** Visibility toggle of project allocation percentages via the "Project allocation (%)" checkbox beneath "List by task", default unchecked
     state, and real-time show/hide behavior in grouped and list-by-task views.
   - **Companion file:** Complements `e2e/summary-project-allocation.spec.ts` and `e2e/summary.spec.ts`.
   - **Describe heading:** Update suite title from `"Issue #241: Make percentage value optional"` to
     `"Summary project allocation percentage visibility toggle"`.

## Project Structure & Guidelines Sync

- `AGENTS.md`: Update Autonomous Feature & Bug Implementation Workflow to reference `e2e/<feature-name>.spec.ts` instead of `e2e/issue-<id>.spec.ts`.
- `.agents/skills/implement-issue/SKILL.md`: Update spec, tasks, and builder instructions to mandate functional test naming (`e2e/<functional-name>.spec.ts`).
- `.agents/agents/feature-implementer.md`, `.agents/agents/code-simplifier.md`, `.agents/agents/architectural-auditor.md`: Update references from
  `e2e/issue-<id>.spec.ts` to `e2e/<functional-name>.spec.ts`.

## Effortum Architectural Guard

- **Dexie Schema Migration:** No database changes.
- **Store Slice Boundaries:** No store slice logic changes.
- **Date & Time Operations:** Unchanged; all dates and times in tests continue using existing dayjs / Playwright helpers.
- **Single Running Task Invariant:** Unchanged.
- **Testing Requirements:**
  - All renamed E2E test files must execute and pass cleanly under Playwright:
    - `pnpm test:e2e e2e/task-manual-add-prefill.spec.ts`
    - `pnpm test:e2e e2e/task-autocomplete-sorting.spec.ts`
    - `pnpm test:e2e e2e/summary-project-allocation.spec.ts`
    - `pnpm test:e2e e2e/summary-project-allocation-toggle.spec.ts`
  - Total test count across the test suites must be preserved (zero test deletions or skips).
- **Git History:** All renames must use `git mv`.

## Boundaries

- Always: Run `pnpm check:invariants`, `pnpm test`, `pnpm test:e2e`, format with Prettier.
- Ask first: Renaming any non-test source files or modifying test assertions/logic beyond file naming and suite titles.
- Never: Suppress tests (`test.skip`, `test.only`), delete test assertions, or bypass invariant checks.

## Success Criteria

1. No E2E test files matching `e2e/*issue-*.spec.ts` remain in the repository.
2. All 4 renamed E2E files pass cleanly via Playwright.
3. Total number of E2E tests remains identical to before the rename (100% test preservation).
4. `AGENTS.md` and `.agents/` guidelines mandate functional naming for E2E tests.
5. `pnpm check:invariants`, `pnpm test`, `pnpm tsc --noEmit`, and `pnpm prettier --check .` all pass.
