# Audit Report: Issue #277

**Status:** AUDIT PASSED  
**Date:** 2026-11-12  
**Scope:** tests: rename e2e files (#277)

## Invariant Verification

| Rule                           | Expected                                        | Result                |
| :----------------------------- | :---------------------------------------------- | :-------------------- |
| `no-direct-dexie-in-ui`        | 0 direct imports in UI                          | Passed (0 violations) |
| `enforce-dayjs`                | 0 raw `new Date()` in `src/`                    | Passed (0 violations) |
| `dexie-migration-immutability` | Versions 1..8 immutable in `src/db.ts`          | Passed (0 violations) |
| `no-suppressed-tests-or-types` | 0 `@ts-ignore`, `@ts-nocheck`, `.skip`, `.only` | Passed (0 violations) |

## Test Verification

| Suite                                     | Status | Details                                             |
| :---------------------------------------- | :----- | :-------------------------------------------------- |
| Vitest Unit Tests (`pnpm test`)           | Passed | 150/150 unit tests passing                          |
| Playwright E2E (`pnpm test:e2e`)          | Passed | 144/144 E2E tests passing; 4 renamed files verified |
| TypeScript Compiler (`pnpm tsc --noEmit`) | Passed | 0 diagnostic errors                                 |
| Prettier (`pnpm prettier --check .`)      | Passed | Clean formatting                                    |

## Test File Renaming Inventory

| Original File           | New Functional File Name                        | Tests Count | Status             |
| :---------------------- | :---------------------------------------------- | :---------- | :----------------- |
| `e2e/issue-51.spec.ts`  | `e2e/task-manual-add-prefill.spec.ts`           | 6 tests     | Verified & Passing |
| `e2e/issue-128.spec.ts` | `e2e/task-autocomplete-sorting.spec.ts`         | 5 tests     | Verified & Passing |
| `e2e/issue-129.spec.ts` | `e2e/summary-project-allocation.spec.ts`        | 3 tests     | Verified & Passing |
| `e2e/issue-241.spec.ts` | `e2e/summary-project-allocation-toggle.spec.ts` | 4 tests     | Verified & Passing |

## Guidelines & Documentation Sync

- `AGENTS.md`: Updated Autonomous Feature & Bug Implementation Workflow to require `e2e/<functional-name>.spec.ts`.
- `.agents/skills/implement-issue/SKILL.md`: Updated specification and task authoring templates to require functional E2E test file names.
- `.agents/agents/*.md`: Synchronized Builder, Simplifier, and Auditor subagent prompts.
- `docs/specs/issue-277-rename-e2e-files/`: Spec, plan, and tasks documented and archived.

## Final Verdict

AUDIT PASSED. Ready for Human Gate 2.
