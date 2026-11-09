# Tasks: Issue #262

- [x] Task 1: Create dedicated `code-simplifier` subagent definition
  - Description: Author `.agents/agents/code-simplifier.md` defining the Code Simplifier subagent persona that applies the `code-simplification` skill to newly
    implemented or modified files while enforcing exact behavior preservation, incremental verification, Effortum architectural invariants, and atomic terminal
    execution rules.
  - Acceptance: `.agents/agents/code-simplifier.md` exists with valid frontmatter and clear directives for post-implementation code simplification.
  - Verify: `pnpm prettier --check .agents/agents/code-simplifier.md`
  - Files: [.agents/agents/code-simplifier.md]

- [x] Task 2: Integrate `code-simplifier` into `/implement-issue` workflow skill
  - Description: Update `.agents/skills/implement-issue/SKILL.md` to add the Simplifier Subagent (`code-simplifier`) to the overview, ASCII pipeline diagram,
    and as Phase 5 immediately after Phase 4 (Builder: `feature-implementer`) and before Phase 6 (Independent Auditor: `architectural-auditor`).
  - Acceptance: `.agents/skills/implement-issue/SKILL.md` defines the 4-stage pipeline and includes the Phase 5 `invoke_subagent` specification and prompt
    contract for `code-simplifier`.
  - Verify: `pnpm prettier --check .agents/skills/implement-issue/SKILL.md`
  - Files: [.agents/skills/implement-issue/SKILL.md]

- [x] Task 3: Synchronize pipeline documentation in `AGENTS.md` and `docs/architecture.md`
  - Description: Update the autonomous implementation workflow sections in `AGENTS.md` and `docs/architecture.md` to document the Simplifier Subagent
    (`code-simplifier`) running `code-simplification` after implementation and before architectural auditing. Format all changed files with Prettier and verify
    repository checks.
  - Acceptance: `AGENTS.md` and `docs/architecture.md` accurately describe the 4-agent workflow, and all invariant, type, unit test, and formatting checks pass.
  - Verify: `pnpm check:invariants`
  - Files: [AGENTS.md, docs/architecture.md]
