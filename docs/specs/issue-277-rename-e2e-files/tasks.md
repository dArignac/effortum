# Tasks: Issue #277

- [x] Task 1: Rename E2E test files and update suite titles
  - Description: Use `git mv` to rename the four issue-named E2E test files to functional capability names:
    - `e2e/issue-51.spec.ts` ➔ `e2e/task-manual-add-prefill.spec.ts`
    - `e2e/issue-128.spec.ts` ➔ `e2e/task-autocomplete-sorting.spec.ts`
    - `e2e/issue-129.spec.ts` ➔ `e2e/summary-project-allocation.spec.ts`
    - `e2e/issue-241.spec.ts` ➔ `e2e/summary-project-allocation-toggle.spec.ts` Update `test.describe` headings inside the files to functional titles without
      issue IDs.
  - Acceptance: No `e2e/issue-*.spec.ts` files remain. All 4 renamed files execute and pass cleanly under Playwright.
  - Verify:
    `pnpm test:e2e e2e/task-manual-add-prefill.spec.ts e2e/task-autocomplete-sorting.spec.ts e2e/summary-project-allocation.spec.ts e2e/summary-project-allocation-toggle.spec.ts`
  - Files: `e2e/task-manual-add-prefill.spec.ts`, `e2e/task-autocomplete-sorting.spec.ts`, `e2e/summary-project-allocation.spec.ts`,
    `e2e/summary-project-allocation-toggle.spec.ts`

- [x] Task 2: Update workflow guidelines and agent prompt templates
  - Description: Update `AGENTS.md`, `.agents/skills/implement-issue/SKILL.md`, and agent markdown files (`.agents/agents/feature-implementer.md`,
    `.agents/agents/code-simplifier.md`, `.agents/agents/architectural-auditor.md`) to guide future implementations to use functional E2E test file names
    (`e2e/<functional-name>.spec.ts`) rather than `e2e/issue-<id>.spec.ts`.
  - Acceptance: All occurrences of `e2e/issue-<id>.spec.ts` in agent and workflow documentation are updated to emphasize functional naming conventions.
  - Verify: `git grep "issue-<id>\.spec\.ts"` returns 0 results.
  - Files: `AGENTS.md`, `.agents/skills/implement-issue/SKILL.md`, `.agents/agents/feature-implementer.md`, `.agents/agents/code-simplifier.md`,
    `.agents/agents/architectural-auditor.md`

- [x] Task 3: Full suite verification and format check
  - Description: Run invariant checks, unit tests, full Playwright E2E suite, TypeScript compiler check, and Prettier checks.
  - Acceptance: `pnpm check:invariants`, `pnpm test`, `pnpm test:e2e`, `pnpm tsc --noEmit`, and `pnpm prettier --check .` all pass with exit code 0.
  - Verify: `pnpm check:invariants && pnpm test && pnpm tsc --noEmit && pnpm prettier --check .`
  - Files: All modified and newly renamed files.
