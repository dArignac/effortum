# Spec: ai: add code simplification after each implementation (#262)

## Objective

Introduce a dedicated Code Simplifier subagent (`code-simplifier`) into the `/implement-issue` autonomous implementation pipeline so that the
`code-simplification` skill runs after every feature or bug implementation (`feature-implementer`) and before the Independent Architectural Audit
(`architectural-auditor`). This ensures that any complex code introduced during implementation is flattened and clarified while preserving exact behavior, test
coverage, and Effortum architectural invariants.

## Acceptance Criteria

1. **Dedicated Subagent Definition (`.agents/agents/code-simplifier.md`):**
   - Created with valid Antigravity agent YAML frontmatter (`name: code-simplifier`, `description`).
   - Explicitly instructs the subagent to activate and follow the `code-simplification` skill.
   - Scopes simplification strictly to files created or modified by the current issue implementation (no drive-by refactoring of unrelated files).
   - Enforces the five principles of `code-simplification`:
     1. Preserve behavior 100% (Chesterton's Fence).
     2. Follow Effortum project conventions (Mantine UI, Zustand slices, `dayjs`, Prettier formatting).
     3. Prefer clarity over cleverness (flatten deep nesting with guard clauses, replace nested ternaries, split overly long functions, remove dead code or
        redundant abstractions).
     4. Maintain balance (do not over-inline orsimplify already-clean code for the sake of it).
     5. Scope to what changed.
   - Requires incremental verification (`pnpm test`, `pnpm tsc --noEmit`, `pnpm check:invariants`, and relevant `pnpm test:e2e` flows) after each change,
     reverting any simplification that breaks tests or invariants.
   - Enforces Effortum's four architectural invariants and terminal execution rules.

2. **Pipeline Integration (`.agents/skills/implement-issue/SKILL.md`):**
   - Updates the Separation-of-Powers overview and ASCII workflow diagram to reflect the four-role pipeline:
     1. Lead Architect (Orchestrator)
     2. Builder Subagent (`feature-implementer`)
     3. Simplifier Subagent (`code-simplifier`)
     4. Independent Auditor Subagent (`architectural-auditor`)
   - Adds **Phase 5: Simplify (Simplifier Subagent: `code-simplifier`)** immediately following **Phase 4: Implement (Builder Subagent: `feature-implementer`)**.
   - Renumbers **Independent Architectural Audit** to **Phase 6** so the Auditor inspects the final post-simplification diff.
   - Provides the `invoke_subagent` configuration (`Role: Code Simplifier`, `Model: inherit`, `TypeName: code-simplifier`) and structured prompt contract.

3. **Documentation Synchronization (`AGENTS.md` & `docs/architecture.md`):**
   - Updates `AGENTS.md` under `Autonomous Feature & Bug Implementation Workflow` to include the Simplifier Subagent (`code-simplifier`).
   - Updates `docs/architecture.md` under `Autonomous Development Pipeline & Spec Archiving` to document the Simplifier Subagent (`code-simplifier`).

## Tech Stack

- Antigravity Custom Agent & Skill definitions (`.agents/agents/*.md`, `.agents/skills/implement-issue/SKILL.md`)
- Markdown documentation (`AGENTS.md`, `docs/architecture.md`)
- TypeScript, Vitest, Playwright, and Prettier for repository verification

## Commands

- Run checks: `pnpm check:invariants`
- Run unit tests: `pnpm test`
- Run E2E tests: `pnpm test:e2e`
- Typecheck: `pnpm tsc --noEmit`
- Format check: `pnpm prettier --check .`

## Project Structure

Files to be created or modified:

- `.agents/agents/code-simplifier.md` (new): Dedicated subagent persona for post-implementation code simplification.
- `.agents/skills/implement-issue/SKILL.md` (modified): Integrate `code-simplifier` as Phase 5 between Builder and Independent Auditor.
- `AGENTS.md` (modified): Document `code-simplifier` in the Autonomous Feature & Bug Implementation Workflow section.
- `docs/architecture.md` (modified): Document `code-simplifier` in the Autonomous Development Pipeline & Spec Archiving section.

## Effortum Architectural Guard

- **Dexie Schema Migration:** No. Does not modify `src/db.ts` or IndexedDB schema.
- **Store Slice Boundaries:** No store slice modifications. UI-to-store boundaries remain unchanged and are enforced by `code-simplifier`.
- **Date & Time Operations:** All date/time logic rules (`dayjs` only, no raw `new Date()`) are preserved and explicitly enforced in
  `.agents/agents/code-simplifier.md`.
- **Single Running Task Invariant:** Unaffected.
- **Testing Requirements:**
  - Verify existing invariant checks (`pnpm check:invariants`), unit tests (`pnpm test`), typecheck (`pnpm tsc --noEmit`), and Prettier formatting
    (`pnpm prettier --check .`).

## Boundaries

- Always: Run `pnpm check:invariants`, keep documentation synchronized, format with Prettier, execute one atomic shell command per invocation.
- Ask first: Schema changes, new dependencies, deleting existing tests.
- Never: Direct Dexie imports in UI, naked `new Date()`, `@ts-ignore`, `test.skip`.

## Success Criteria

1. `.agents/agents/code-simplifier.md` exists with YAML frontmatter and comprehensive directives grounded in `code-simplification` and Effortum invariants.
2. `.agents/skills/implement-issue/SKILL.md` includes `code-simplifier` in its overview, workflow diagram, and Phase 5 instructions before the Auditor phase.
3. `AGENTS.md` and `docs/architecture.md` accurately reflect the updated 4-agent workflow.
4. `pnpm check:invariants`, `pnpm test`, `pnpm tsc --noEmit`, and `pnpm prettier --check .` all pass with zero errors.
