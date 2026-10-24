# Spec: Issue Pipeline Skill (`issue-pipeline-skill`)

## Objective

Implement the Antigravity workflow skill (`skills/implement-issue/SKILL.md`) and slash command `/implement-issue` that orchestrates autonomous,
human-in-the-loop feature and bug implementation. It operationalizes the Separation-of-Powers architecture (Lead Architect → Builder → Independent Auditor),
manages GitHub issues labeled `ready-for-implementation`, evaluates issue sizing, creates child issues upon approval, and archives immutable specs in
`docs/specs/issue-<id>-<slug>/`.

## Tech Stack

- Antigravity Custom Skill format (`SKILL.md` with YAML frontmatter)
- GitHub MCP / `gh` CLI for issue queries and child issue creation
- TypeScript / Vitest / Playwright for target verification
- Invariant Guard (`pnpm check:invariants`) for automated architectural auditing

## Commands

- **Invoke via CLI Slash Command:** `/implement-issue`
- **Invoke for Specific Issue:** `/implement-issue <issue-number>`
- **Auditor Invariant Verification:** `pnpm check:invariants`
- **Builder/Auditor Test Suite:** `pnpm test && pnpm test:e2e`

## Project Structure

```
skills/
└── implement-issue/
    └── SKILL.md                 # Antigravity skill definition, workflow gates, subagent prompt contracts
docs/specs/
├── autonomous-issue-pipeline/
│   ├── CAPABILITY-MAP.md        # Pipeline capability map
│   ├── SPEC-invariant-guard.md  # Module 1 spec
│   └── SPEC-issue-pipeline-skill.md # This specification
└── issue-<id>-<slug>/           # Target directory convention for future issues
    ├── spec.md                  # Binding contract spec (Phase 1)
    ├── plan.md                  # Architecture & dependency plan (Phase 2)
    ├── tasks.md                 # Vertical task breakdown with verification steps (Phase 3)
    └── audit-report.md          # Independent auditor verification report
```

## Sizing & Ticket Splitting Heuristics (Phase 0: Scope Check)

Before drafting a specification, the Architect evaluates whether the issue is oversized:

- **Triggers for Proposing Split:**
  1. The issue impacts ≥2 domain store slices (e.g. `taskSlice` + `settingsOvertimeSlice`).
  2. The issue requires both a database migration in `src/db.ts` and changes across ≥2 distinct UI pages.
  3. The issue bundles >2 independent user-facing capabilities that can be tested separately.
- **Split Action:**
  - Proposes a capability map of child issues.
  - Asks the human: _"Would you like me to create these child issues on GitHub with label 'ready-for-implementation'?"_
  - Uses GitHub MCP `create_issue` or `gh issue create` upon user confirmation, referencing the parent issue.

## Three-Agent Responsibility Contracts

### 1. Lead Architect (Orchestrator Context)

The Lead Architect owns the upfront scoping, planning, and task breakdown methodology extracted from `spec-driven-development` (Phases 0 through 3), stopping
strictly before Phase 4 (Implementation):

- **Triage:** Queries GitHub issues labeled `ready-for-implementation` via GitHub MCP / `gh` CLI.
- **Selection:** Prompts human to select which issue to implement (or accepts issue number as command argument).
- **Phase 0 (Scope Check & Sizing):** Evaluates sizing heuristic; if oversized, proposes split and creates child issues upon confirmation.
- **Phase 1 (Specify):** Authors `docs/specs/issue-<id>-<slug>/spec.md` covering the 6 core areas (Objective, Commands, Project Structure, Code Style, Testing
  Strategy, Boundaries) plus the mandatory **Effortum Architectural Guard** section (Dexie migration plan, store slice boundaries, single active task invariant,
  `dayjs` usage, test criteria).
- **Phase 2 (Plan):** Authors `docs/specs/issue-<id>-<slug>/plan.md` defining the component dependency graph, implementation order, risks & mitigations, and
  verification checkpoints.
- **Phase 3 (Tasks):** Authors `docs/specs/issue-<id>-<slug>/tasks.md` breaking the plan into discrete, vertically-sliced tasks with explicit acceptance
  criteria, verification commands, and files touched.
- **Human Gate 1 (Spec & Plan Approval):** Summarizes the spec, plan, and tasks, then pauses for explicit human sign-off.
- **Delegation:** Upon human approval, invokes the **Builder Subagent** to execute Phase 4 (Implementation) hands-free.

### 2. Builder Subagent (Implementation Context — Phase 4: Implement via `incremental-implementation`)

The Builder agent is focused purely on disciplined execution, applying the vertical-slice methodology from `incremental-implementation`:

- **Role:** Autonomous Feature Implementer invoked via `invoke_subagent` (Model: `inherit`, Role: `Feature Implementer`).
- **Input:** Receives the frozen contract: `docs/specs/issue-<id>-<slug>/spec.md`, `plan.md`, and `tasks.md`.
- **Execution Methodology:**
  - **Task-by-Task Slicing:** Executes the task list from `tasks.md` sequentially one task at a time. Never bundles multiple tasks into one blind pass.
  - **The Increment Cycle:** For each slice:
    1. _Implement:_ Write the smallest complete piece of functionality in `src/` conforming to Mantine and Zustand slice conventions.
    2. _Test:_ Write alongside unit tests (`*.test.ts`) using Vitest or Playwright E2E flows (`e2e/issue-<id>.spec.ts`).
    3. _Verify:_ Confirm tests pass (`pnpm test`), TypeScript compiles (`pnpm tsc --noEmit`), and invariants hold (`pnpm check:invariants`).
    4. _Checkpoint:_ Mark the task completed in `tasks.md` before picking up the next slice.
  - **Simplicity First (Rule 0):** Build the simplest thing that could work. Three similar lines of code beat a premature abstraction. Optimize only after
    correctness is proven with tests.
  - **Scope Discipline (Rule 0.5):** Touch only what the current task requires. No "cleaning up" adjacent files, no unprompted refactoring of unrelated modules.
  - **Keep It Compilable & Green (Rule 2):** Every increment must leave the codebase compilable and passing tests.
  - **Self-Healing Loop:** If a test or compiler error occurs during a slice, runs an internal repair cycle (up to 3 attempts) before halting.
  - **Guardrail Constraints:** Strictly prohibited from silencing types (`@ts-ignore`, `@ts-nocheck`), skipping tests (`.skip`, `.only`), or bypassing Zustand
    store slices.
- **Output:** Returns completed git diff, task completion log in `tasks.md`, and hands off to the Orchestrator for independent auditing.

### 3. Independent Auditor Subagent (Verification Context)

- Invoked by the Lead Architect via `invoke_subagent` (Model: `inherit`, Role: `Architectural Auditor`) in a clean context.
- Executes `pnpm check:invariants` (enforcing `no-direct-dexie-in-ui`, `enforce-dayjs`, `dexie-migration-immutability`, `no-suppressed-tests-or-types`).
- Executes `pnpm test` and `pnpm test:e2e`.
- Verifies and updates `docs/architecture.md` to reflect architectural changes.
- Generates `docs/specs/issue-<id>-<slug>/audit-report.md`.
- Rejection handling: If any invariant or test fails, returns actionable failure report to Builder (circuit breaker: max 2 audit round-trips before human
  escalation).
- Staging: Prepares git branch `feature/issue-<id>` and stages PR for **Human Gate 2**.

## Boundaries

- **Always:**
  - Preserve Human Gate 1 (Spec Approval) and Human Gate 2 (PR/Diff Approval).
  - Save specs exclusively to `docs/specs/issue-<id>-<slug>/` to prevent overwriting.
  - Run `pnpm check:invariants` before staging any PR.
  - Update `docs/architecture.md` whenever system design or entity behavior changes.
- **Ask First:**
  - Creating child issues on GitHub when an issue is split.
  - Adding dependencies or modifying database schema.
- **Never:**
  - Auto-merge to `main` without human inspection.
  - Allow the Builder agent to self-audit without independent Auditor review.
  - Overwrite historical specs in `docs/specs/`.

## Success Criteria

- [ ] `skills/implement-issue/SKILL.md` is created with clear instructions, prompt contracts, and slash command integration.
- [ ] Ticket sizing heuristics and child issue creation workflow are explicitly defined.
- [ ] Subagent invocation parameters and prompt templates for Builder and Auditor are defined.
- [ ] Documentation in `AGENTS.md` and `docs/architecture.md` is updated to describe the pipeline.

## Open Questions

- None.
