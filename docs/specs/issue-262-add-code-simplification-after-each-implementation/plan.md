# Plan: ai: add code simplification after each implementation (#262)

## 1. Component Dependency Graph

```text
[.agents/agents/code-simplifier.md] (New Subagent Persona)
          │
          ▼
[.agents/skills/implement-issue/SKILL.md] (Workflow Orchestration: Phase 4 Builder → Phase 5 Simplifier → Phase 6 Auditor)
          │
          ▼
[AGENTS.md & docs/architecture.md] (Architecture & Developer Guidance Sync)
```

## 2. Implementation Order

1. **Create Dedicated Subagent Persona (`.agents/agents/code-simplifier.md`):**
   - Define YAML frontmatter (`name: code-simplifier`, `description`).
   - Specify directives for activating and applying the `code-simplification` skill:
     - Scope strictly to files modified during the current issue implementation.
     - Preserve exact behavior (Chesterton's Fence) and never weaken or modify tests to force a simplification.
     - Flatten deep nesting, replace nested ternaries, split overly long functions, and remove redundant code while avoiding over-simplification.
     - Verify incrementally after each change (`pnpm test`, `pnpm tsc --noEmit`, `pnpm check:invariants`, `pnpm prettier --check .`).
     - Respect Effortum's four architectural invariants and atomic terminal command execution rules.

2. **Update Issue Implementation Skill (`.agents/skills/implement-issue/SKILL.md`):**
   - Update the `description` frontmatter and `Overview` section to include the **Simplifier Subagent (`code-simplifier`)**.
   - Update the ASCII pipeline diagram to insert `3. Simplifier Subagent ('code-simplifier')` between `2. Builder Subagent` and `4. Auditor Subagent` (and
     include it in the rejection loop path if the Builder makes subsequent fixes).
   - Add **Phase 5: Simplify (Simplifier Subagent: `code-simplifier`)** with `invoke_subagent` parameters and prompt template.
   - Renumber **Independent Architectural Audit** to **Phase 6**.

3. **Synchronize Repository Documentation (`AGENTS.md` & `docs/architecture.md`):**
   - Update `AGENTS.md` (`Autonomous Feature & Bug Implementation Workflow`) to list the 4-stage agent pipeline (Lead Architect → Builder → Simplifier →
     Independent Auditor).
   - Update `docs/architecture.md` (`Autonomous Development Pipeline & Spec Archiving`) to document the Simplifier Subagent (`code-simplifier`).
   - Run Prettier and verification checks (`pnpm prettier --check .`, `pnpm check:invariants`, `pnpm test`, `pnpm tsc --noEmit`).

## 3. Risks & Mitigations

- **Risk:** Over-eager code simplification could alter behavior, break architectural invariants, or touch unrelated files across the repository.
  - **Mitigation:** Explicitly constrain `code-simplifier` to only the files modified by the issue (`spec.md` / `tasks.md`), require incremental test and
    invariant verification after each simplification, instruct it to revert on any failure, and run `architectural-auditor` _after_ `code-simplifier` so the
    final diff undergoes full independent verification.
- **Risk:** Markdown formatting inconsistencies (line length or table/diagram formatting).
  - **Mitigation:** Run `pnpm prettier --write` on modified Markdown files while keeping ASCII diagrams intact, then verify with `pnpm prettier --check .`.

## 4. Verification Checkpoints

- Checkpoint 1: `.agents/agents/code-simplifier.md` created and formatted cleanly.
- Checkpoint 2: `.agents/skills/implement-issue/SKILL.md` updated with Phase 5 (`code-simplifier`) and Phase 6 (`architectural-auditor`).
- Checkpoint 3: `AGENTS.md` and `docs/architecture.md` updated and synchronized.
- Checkpoint 4: `pnpm check:invariants`, `pnpm test`, `pnpm tsc --noEmit`, and `pnpm prettier --check .` pass.
