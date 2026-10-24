# Task List: Issue Pipeline Skill (`issue-pipeline-skill`)

## Task 1: Author Antigravity Skill Definition (`skills/implement-issue/SKILL.md`)

- [x] Task: Create `skills/implement-issue/SKILL.md` detailing the entire workflow:
  - YAML frontmatter with `name: implement-issue`, `description`.
  - Issue triage via GitHub MCP / `gh` filtering for `ready-for-implementation`.
  - Sizing heuristic check and prompt to create GitHub child issues.
  - Phase 1–3 authoring (`docs/specs/issue-<id>-<slug>/spec.md`, `plan.md`, `tasks.md`).
  - Human Gate 1 (Spec & Plan Approval).
  - Builder subagent invocation prompt contract embedding `incremental-implementation`.
  - Auditor subagent invocation prompt contract enforcing `pnpm check:invariants`, tests, and `docs/architecture.md` sync.
  - Human Gate 2 (PR & Diff Approval).
- Acceptance criteria:
  - Full skill markdown matches `SPEC-issue-pipeline-skill.md` requirements.
  - Subagent prompt templates are complete, self-contained, and copy-pasteable.
- Verification: `pnpm prettier --check skills/implement-issue/SKILL.md`
- Files touched:
  - `skills/implement-issue/SKILL.md`

## Task 2: Document Autonomous Workflow in AGENTS.md

- [x] Task: Update `AGENTS.md` with:
  - `/implement-issue` command listed in development guidance.
  - A dedicated section explaining the Separation-of-Powers workflow (Architect → Builder → Auditor) and the two human decision gates.
- Acceptance criteria:
  - `AGENTS.md` accurately documents the workflow for any AI assistant or developer working in the repository.
- Verification: `pnpm prettier --check AGENTS.md`
- Files touched:
  - `AGENTS.md`

## Task 3: Update Architecture Documentation in docs/architecture.md

- [x] Task: Update `docs/architecture.md` to document the architectural invariant guard (`scripts/check-invariants.ts`, `pnpm check:invariants`), the spec
      archiving structure (`docs/specs/issue-<id>-<slug>/`), and the agentic execution model.
- Acceptance criteria:
  - `docs/architecture.md` accurately reflects the new invariant enforcement and spec conventions.
- Verification: `pnpm prettier --check docs/architecture.md`
- Files touched:
  - `docs/architecture.md`

## Task 4: Run Complete Repository Verification Suite

- [x] Task: Execute the complete verification suite (`pnpm check:invariants`, `pnpm test`, `pnpm tsc --noEmit`, Prettier).
- Acceptance criteria:
  - All invariant checks pass with zero violations.
  - All 11 Vitest test suites (96 tests) pass.
  - All markdown, TypeScript, and JSON files format cleanly.
- Verification: `pnpm check:invariants && pnpm test && pnpm tsc --noEmit`
- Files touched:
  - Repository-wide verification
