---
name: implement-issue
description:
  Orchestrates autonomous, human-in-the-loop feature and bug implementation for GitHub issues labeled 'ready-for-implementation'. Uses a Separation-of-Powers
  architecture (Lead Architect → Builder → Independent Auditor), enforces non-overwriting spec-driven development, applies incremental implementation, and
  verifies Effortum architectural invariants.
---

# Implement Issue

## Overview

Automates the end-to-end implementation of GitHub issues labeled `ready-for-implementation` while keeping the human in control at high-leverage decision gates.

The pipeline enforces a strict **Separation of Powers** across three distinct agents:

1. **Lead Architect (Orchestrator):** Triages issues, evaluates sizing, authors the binding contract (`spec.md`, `plan.md`, `tasks.md`) in an isolated
   directory, and halts for **Human Gate 1**.
2. **Builder Subagent (`feature-implementer`):** Distinct persona defined in `agents/feature-implementer.md`. Hands-free execution following
   `incremental-implementation` (task-by-task slices, simplicity first, scope discipline, 3 self-heal cycles).
3. **Independent Auditor Subagent (`architectural-auditor`):** Distinct persona defined in `agents/architectural-auditor.md`. Runs in a clean context to execute
   `pnpm check:invariants`, unit & E2E tests, verifies documentation sync in `docs/architecture.md`, and halts for **Human Gate 2**.

```
[GitHub Issues: 'ready-for-implementation']
                    │
                    ▼
       ┌─────────────────────────┐
       │   1. Lead Architect     │ ◄─── Checks sizing / offers child issues on GitHub
       │     (Orchestrator)      │ ◄─── Authors spec.md, plan.md, tasks.md
       └────────────┬────────────┘
                    │
                    ▼
       [Human Gate 1: Spec & Plan Approval]
                    │
                    ▼
       ┌─────────────────────────┐
       │   2. Builder Subagent   │ ◄─── Persona: 'feature-implementer' (agents/feature-implementer.md)
       │  (incremental-impl)     │ ◄─── Up to 3 internal self-heal cycles
       └────────────┬────────────┘
                    │
                    ▼
       ┌─────────────────────────┐
       │  3. Auditor Subagent    │ ◄─── Persona: 'architectural-auditor' (agents/architectural-auditor.md)
       │   (Independent Guard)   │ ◄─── Runs `pnpm check:invariants`, tests, docs sync
       └────────────┬────────────┘
                    │ (If rejected: max 2 loops back to Builder)
                    ▼
       [Human Gate 2: PR & Diff Approval]
```

## Trigger Phrases

- `/implement-issue`
- `/implement-issue <issue-number>`
- "Implement issue #<issue-number>"
- "Work on ready issues"

---

## The Gated Workflow

### Phase 0: Triage, Selection & Scope Check

1. **Query Issues:**
   - Query GitHub issues labeled `ready-for-implementation` using GitHub MCP (`call_mcp_tool` with `github`/`list_issues`) or
     `gh issue list --label ready-for-implementation`.
   - If an issue number was provided in arguments, fetch that specific issue.
   - If multiple issues exist and none specified, present an interactive list to the human:
     ```
     Available issues ready for implementation:
     - #224: Adds action to start a task without manual project/comment selection
     - #235: Export overtime balance to CSV
     → Which issue shall we implement?
     ```

2. **Evaluate Sizing Heuristics:** Before drafting any specification, check if the issue is oversized:
   - Does it impact ≥2 domain store slices (e.g. `taskSlice` and `settingsOvertimeSlice`)?
   - Does it require both a database migration in `src/db.ts` and changes across ≥2 distinct UI pages?
   - Does it bundle >2 independent user-facing capabilities that could ship and be tested separately?

3. **Handle Oversized Issues (Split Proposal):**
   - If any sizing heuristic triggers, do NOT proceed with a monolithic spec.
   - Propose a capability map decomposing the issue into smaller, focused child issues with dependency order.
   - Ask the human:
     > _"This issue bundles multiple independent capabilities. Would you like me to create these child issues on GitHub labeled 'ready-for-implementation'?"_
   - Upon confirmation, use GitHub MCP `create_issue` or `gh issue create` to create the child issues, cross-referencing the parent ticket. Halt or prompt the
     user which child issue to implement first.

---

### Phase 1: Specify (Contract Authoring)

Create an isolated directory for the issue: `docs/specs/issue-<id>-<slug>/`. Draft `docs/specs/issue-<id>-<slug>/spec.md` covering the 6 core areas and the
**Effortum Architectural Guard**:

```markdown
# Spec: [Issue Title] (#<id>)

## Objective

[What is being built, why, and acceptance criteria from the issue]

## Tech Stack

[TypeScript, Mantine UI, Zustand, Dexie.js, Dayjs]

## Commands

- Run checks: pnpm check:invariants
- Run unit tests: pnpm test
- Run E2E tests: pnpm test:e2e
- Typecheck: pnpm tsc --noEmit

## Project Structure

[Files to be created or modified]

## Effortum Architectural Guard

- **Dexie Schema Migration:** [Does this require a new version(N+1) in src/db.ts? Yes/No. If yes, specify migration logic]
- **Store Slice Boundaries:** [Which slices in src/store/slices/ are modified? UI must only access data through store]
- **Date & Time Operations:** [All date/time logic must use dayjs. No raw new Date()]
- **Single Running Task Invariant:** [Does this touch task start/stop behavior? Ensure only one running task at a time]
- **Testing Requirements:** [Specify unit tests (*.test.ts) and Playwright E2E flows (e2e/issue-<id>.spec.ts)]

## Boundaries

- Always: Run pnpm check:invariants, write tests alongside code, format with Prettier.
- Ask first: Schema changes, new dependencies, deleting existing tests.
- Never: Direct Dexie imports in UI, naked new Date(), @ts-ignore, test.skip.

## Success Criteria

[Testable conditions proving completion]
```

---

### Phase 2: Plan (Technical Approach)

Draft `docs/specs/issue-<id>-<slug>/plan.md` defining:

1. Component dependency graph (e.g., Models → Dexie → Store Slice → UI Components → E2E Tests).
2. Implementation order (foundations first, then UI, then tests).
3. Risks and mitigations.
4. Verification checkpoints.

---

### Phase 3: Tasks (Vertical Slices)

Draft `docs/specs/issue-<id>-<slug>/tasks.md` breaking the plan into discrete vertical slices:

```markdown
# Tasks: Issue #<id>

- [ ] Task 1: [Short title]
  - Description: [What this slice accomplishes]
  - Acceptance: [Specific testable condition]
  - Verify: [Exact test command, e.g. pnpm test src/store/slices/taskSlice.test.ts]
  - Files: [src/store/slices/taskSlice.ts, src/store/slices/taskSlice.test.ts]

- [ ] Task 2: [Short title]
  - Description: [What this slice accomplishes]
  - Acceptance: [Specific testable condition]
  - Verify: [pnpm test && pnpm tsc --noEmit]
  - Files: [src/components/TaskAction.tsx]

- [ ] Task 3: [E2E verification flow]
  - Description: [Add Playwright E2E test verifying end-to-end user experience]
  - Acceptance: [E2E test passes headless]
  - Verify: [pnpm test:e2e e2e/issue-<id>.spec.ts]
  - Files: [e2e/issue-<id>.spec.ts]
```

---

### Human Gate 1: Spec & Plan Approval

Stop your turn immediately after authoring `spec.md`, `plan.md`, and `tasks.md`. Present the summary to the human:

```
I have analyzed issue #<id> and authored the specification, plan, and tasks:
- Spec: docs/specs/issue-<id>-<slug>/spec.md
- Plan: docs/specs/issue-<id>-<slug>/plan.md
- Tasks: docs/specs/issue-<id>-<slug>/tasks.md

Do you approve this specification and task plan to proceed to implementation?
```

**CRITICAL:** Do NOT invoke the Builder subagent or write application code until the human explicitly replies with approval.

---

### Phase 4: Implement (Builder Subagent: `feature-implementer`)

Once Gate 1 is approved, invoke the dedicated **Builder Subagent** via `invoke_subagent` using the `feature-implementer` agent definition
([agents/feature-implementer.md](../../agents/feature-implementer.md)):

- **Role:** `Feature Implementer`
- **Model:** `inherit`
- **TypeName:** `feature-implementer`
- **Prompt:**

```
You are the Feature Implementer subagent for Effortum. Your job is to implement Issue #<id> strictly following the approved contract.

CONTRACT FILES:
- Spec: docs/specs/issue-<id>-<slug>/spec.md
- Plan: docs/specs/issue-<id>-<slug>/plan.md
- Tasks: docs/specs/issue-<id>-<slug>/tasks.md

EXECUTION DISCIPLINE (incremental-implementation):
1. Execute tasks in tasks.md ONE BY ONE in sequential order. Do NOT attempt all tasks at once.
2. For each task slice:
   a. Implement the smallest complete piece of functionality in src/.
   b. Write/update unit tests (*.test.ts) or Playwright flows (e2e/issue-<id>.spec.ts).
   c. Verify: Run the task's verify command, plus `pnpm tsc --noEmit` and `pnpm check:invariants`.
   d. Checkpoint: Mark the task completed in tasks.md before moving to the next task.
3. Rule 0 (Simplicity First): Write the simplest working implementation. No speculative abstractions.
4. Rule 0.5 (Scope Discipline): Touch strictly the files listed in the task. Do NOT clean up unrelated code or refactor adjacent files.
5. Rule 2 (Keep It Compilable): Never leave the repository in a broken state between tasks.
6. Self-Healing: If a test fails, you have up to 3 repair cycles to fix the code. If still failing after 3 attempts, halt and report the exact blocker.
7. Architectural Invariants:
   - Zero direct Dexie imports in UI components/pages (use Zustand store slices).
   - Use dayjs for all date/time logic. Never use raw new Date().
   - Never use @ts-ignore, @ts-nocheck, or .skip on tests.

When all tasks in tasks.md are checked off and `pnpm check:invariants && pnpm test` passes, return your completed diff and summary to the Lead Architect.
```

---

### Phase 5: Independent Architectural Audit (Auditor Subagent: `architectural-auditor`)

Upon receiving the Builder's completion, invoke the dedicated **Independent Auditor Subagent** via `invoke_subagent` using the `architectural-auditor` agent
definition ([agents/architectural-auditor.md](../../agents/architectural-auditor.md)) in a clean context:

- **Role:** `Architectural Auditor`
- **Model:** `inherit`
- **TypeName:** `architectural-auditor`
- **Prompt:**

```
You are the Independent Architectural Auditor for Effortum. Your job is to inspect the completed diff for Issue #<id> with zero confirmation bias.

AUDIT CHECKS TO EXECUTE:
1. Invariant Script: Run `pnpm check:invariants`. Must exit with code 0.
2. Unit Test Suite: Run `pnpm test`. All unit tests must pass.
3. E2E Test Suite: Run `pnpm test:e2e`. Playwright tests must pass.
4. Typecheck: Run `pnpm tsc --noEmit`. Must exit with 0 errors.
5. Invariant Checks against AGENTS.md:
   - Persistence: If src/db.ts changed, verify Dexie version was incremented.
   - UI Boundaries: Verify no files in src/components, src/pages, or src/routes import Dexie directly.
   - Date Logic: Verify all date operations use dayjs.
   - Test Integrity: Verify no tests were deleted or assertions loosened.
6. Architecture Sync: Check if the change modified core models, database schema, state patterns, or routes. If so, verify that `docs/architecture.md` was accurately updated.
7. Prettier Check: Run `pnpm prettier --check .`.

OUTPUT:
Write your audit findings to `docs/specs/issue-<id>-<slug>/audit-report.md`.
- If violations exist: Return a structured failure report with exact file, line, and remediation instructions. (Circuit breaker: max 2 round trips back to Builder).
- If clean: Report AUDIT PASSED.
```

---

### Human Gate 2: PR & Diff Approval

Once the Auditor verifies the implementation:

1. Orchestrator ensures the working branch `feature/issue-<id>` is clean.
2. Summarizes the completed work:
   - Link to `docs/specs/issue-<id>-<slug>/spec.md`
   - Link to `docs/specs/issue-<id>-<slug>/audit-report.md`
   - List of files modified
   - Verification results (`pnpm check:invariants`, Vitest, Playwright all green)
3. Staged PR is presented to the human for final review and merge.
