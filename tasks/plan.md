# Implementation Plan: Issue Pipeline Skill (`issue-pipeline-skill`)

## Overview

Implement the Antigravity workflow skill (`skills/implement-issue/SKILL.md`), the prompt contracts for the Builder and Auditor subagents, and update the
repository documentation in `AGENTS.md` and `docs/architecture.md`.

## Dependency Graph

```
skills/implement-issue/SKILL.md (Workflow, Sizing & Subagent Contracts)
          │
          ▼
AGENTS.md (Workflow Guidance & Slash Command Documentation)
          │
          ▼
docs/architecture.md (Architecture Documentation Sync)
          │
          ▼
Verification & Dry-Run Check (Invariants, Prettier, Lint)
```

## Implementation Order

1. **Skill Definition (`skills/implement-issue/SKILL.md`):**
   - Frontmatter, triggers, and execution lifecycle.
   - Sizing heuristic checker and automated GitHub child issue creation.
   - Spec, Plan, and Task generation methodology (Phases 0–3 from `spec-driven-development`) writing to `docs/specs/issue-<id>-<slug>/`.
   - Human Gate 1 definition (Spec, Plan & Tasks Approval).
   - Builder Subagent prompt contract embedding `incremental-implementation` (Phase 4).
   - Independent Auditor Subagent prompt contract enforcing `pnpm check:invariants`, tests, and doc sync (Phase 5).
   - Human Gate 2 definition (PR & Diff Approval).

2. **Repository Workflow Guidance (`AGENTS.md`):**
   - Document the `/implement-issue` command under Development Commands.
   - Add the **Autonomous Feature & Bug Implementation Workflow** section describing the Separation-of-Powers architecture and decision gates.

3. **Architecture Documentation (`docs/architecture.md`):**
   - Document the agentic architecture, invariant verification tooling, and spec archiving structure in `docs/architecture.md`.

4. **Full Verification:**
   - Run `pnpm check:invariants`.
   - Run `pnpm test`.
   - Run `pnpm prettier --check .`.

## Risks & Mitigations

- **Risk:** Auditor subagent ping-pongs endlessly with Builder subagent on minor formatting differences.
  - _Mitigation:_ Hard circuit breaker: maximum 2 rejection round-trips before escalating to human with clear logs.
- **Risk:** Subagent prompts become ambiguous about where to save specs.
  - _Mitigation:_ Explicit path contracts (`docs/specs/issue-<id>-<slug>/`) in skill instructions and subagent prompts.

## Verification Checkpoints

1. `skills/implement-issue/SKILL.md` exists with valid YAML frontmatter and comprehensive instructions.
2. `pnpm check:invariants` passes cleanly with zero violations.
3. `pnpm test` passes 100% of tests.
4. Prettier checks pass on all new and modified files.
