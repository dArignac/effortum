# Autonomous Issue Implementation Pipeline (Separation-of-Powers Agentic Setup)

## Problem Statement

How might we design a lean, human-in-the-loop autonomous pipeline in Antigravity CLI that takes GitHub issues labeled `ready-for-implementation` through
spec-driven development, implementation, and independent architectural auditing without overwriting specs or compromising repository constraints?

---

## Recommended Direction: Separation-of-Powers Trio (Architect → Builder → Auditor)

We implement a 3-agent pipeline orchestrated through a local Antigravity CLI workflow skill/command (`/implement-issue`). It isolates the **authoring of the
contract**, the **writing of code**, and the **deterministic verification of architectural invariants** into distinct boundaries with two high-leverage human
checkpoints:

```
[GitHub Issues: 'ready-for-implementation']
                    │
                    ▼
       ┌─────────────────────────┐
       │   1. Lead Architect     │ ◄─── Checks sizing / offers GitHub child issue creation
       │     (Orchestrator)      │ ◄─── Uses spec-driven-development (spec.md + plan.md)
       └────────────┬────────────┘
                    │
                    ▼
       [Human Gate 1: Spec Approval]
                    │
                    ▼
       ┌─────────────────────────┐
       │   2. Builder Subagent   │ ◄─── Implements code & Vitest/Playwright tests
       │     (Hands-free)        │ ◄─── Up to 3 internal self-heal cycles
       └────────────┬────────────┘
                    │
                    ▼
       ┌─────────────────────────┐
       │  3. Auditor Subagent    │ ◄─── Fresh context: runs `pnpm check:invariants`,
       │   (Independent Check)   │      runs tests, verifies docs/architecture.md
       └────────────┬────────────┘
                    │ (If rejected: max 2 loops back to Builder)
                    ▼
       [Human Gate 2: PR & Diff Approval]
```

### Responsibility Boundaries

1. **Lead Architect (Orchestrator Context):**
   - **Issue Triage:** Fetches issues labeled `ready-for-implementation` via GitHub MCP / `gh` CLI and presents an interactive picker.
   - **Sizing & Split Slicing:** Evaluates ticket complexity (touches ≥2 domain store slices, requires both a Dexie migration in `src/db.ts` and ≥2 UI pages, or
     bundles >2 independent user capabilities). If oversized, proposes a concrete split and offers to create the child issues directly on GitHub labeled
     `ready-for-implementation`.
   - **Contract Specification:** Runs the `spec-driven-development` skill to draft `docs/specs/issue-<id>-<slug>/spec.md` and `plan.md`. Mandates an **Effortum
     Architectural Guard** section detailing: Dexie migration requirements, store slice boundaries, single running task invariant handling, `dayjs` usage, and
     Vitest/Playwright test targets.
   - **Human Gate 1:** Freezes the contract upon human sign-off.

2. **Builder Subagent (Implementation Worker):**
   - Receives the frozen `spec.md`. Runs hands-free in an isolated subagent context.
   - Modifies codebase in `src/` following Mantine and Zustand slice patterns.
   - Writes unit tests in Vitest alongside code (`*.test.ts`) and E2E flows in Playwright (`e2e/issue-<id>.spec.ts`).
   - Self-heals compilation/test errors up to a maximum of **3 cycles**. Hands off the completed diff to the Auditor.

3. **Independent Auditor Subagent (Clean-Context Guard):**
   - Operates in a fresh context with zero builder confirmation bias.
   - **Deterministic Invariant Verification:** Executes `pnpm check:invariants` (a dedicated repository script) verifying:
     - **Persistence Guard:** If tables or indexes changed, was the Dexie version incremented in `src/db.ts`?
     - **Boundary Guard:** Are there zero direct Dexie imports from `src/components/` or `src/pages/`?
     - **Time & Date Guard:** Are all date operations using `dayjs` (no naked `new Date()`)?
     - **Test Integrity Guard:** Were any existing tests deleted or assertions weakened?
   - **Test Execution:** Runs `pnpm test` and `pnpm test:e2e` to verify 100% green.
   - **Doc Sync Guard:** Validates that changes affecting overall system design are reflected in `docs/architecture.md`.
   - Writes `docs/specs/issue-<id>-<slug>/audit-report.md`.
   - If violations exist, kicks the diff back to the Builder with an actionable rejection report (Circuit breaker: max 2 round-trips before surfacing to human).
   - On pass, stages the clean branch/PR for **Human Gate 2**.

---

## Key Assumptions to Validate

- [ ] **Sizing heuristic accuracy:** Sizing criteria correctly identify oversized tickets without false positives on standard features. _(Test: dry-run against
      5 historical issues)._
- [ ] **Deterministic invariant script:** `pnpm check:invariants` catches AST/boundary violations fast and reliably with zero false alarms. _(Test: run against
      existing repo and test with synthetic violations)._
- [ ] **Headless Playwright reliability:** Playwright runs stably in the subagent environment without UI flakes or hanging processes. _(Test: execute
      `pnpm test:e2e` from a subagent)._
- [ ] **Auditor/Builder loop convergence:** The Builder resolves Auditor rejections within ≤2 cycles without human intervention. _(Test: introduce an
      intentional direct Dexie import in a component and verify Auditor flags it and Builder refactors to Zustand)._
- [ ] **Spec review speed:** Generating the spec takes under 3 minutes of human reading time, keeping the human in the loop without fatigue.

---

## MVP Scope

### In Scope

- A dedicated Antigravity workflow skill/slash command: `/implement-issue`.
- GitHub issue fetcher filtering by `ready-for-implementation`.
- Sizing analyzer proposing issue splits with automated creation of child issues on GitHub via MCP upon approval.
- Dedicated non-overwriting spec archiving under `docs/specs/issue-<id>-<slug>/` containing `spec.md`, `plan.md`, and `audit-report.md`.
- Deterministic verification script `pnpm check:invariants` (checking Dexie imports, `dayjs` usage, schema versioning).
- Two distinct subagents (`builder` and `auditor`) with explicit prompt boundaries and hard circuit breakers (3 build loops, 2 audit loops).
- Automated update verification for `docs/architecture.md`.

### Out of Scope

- Automatic merging to `main` without human inspection (Human Gate 2 is non-negotiable).
- Auto-closing GitHub issues before PR merge.
- Multi-agent swarm sprawl (no separate planner, documentation writer, or UX agent; keep it strictly Architect → Builder → Auditor).
- Autonomous ticket creation on GitHub without explicit human approval of the split plan.

---

## Not Doing (and Why)

- **Not allowing the Builder to self-audit:** LLMs suffer from confirmation bias and tend to relax test assertions or silence TypeScript errors when trying to
  force a green build.
- **Not relying purely on prompt-based architectural checking:** Prompts can be ignored; `pnpm check:invariants` provides a deterministic gate before any PR is
  staged.
- **Not overwriting a shared `SPEC.md`:** A global `SPEC.md` gets destroyed on every new feature. Archiving by issue (`docs/specs/issue-<id>-<slug>/`) maintains
  a historical decision log while keeping `docs/architecture.md` as the living source of truth.
- **Not micro-prompting the human during code implementation:** Involving humans on individual file edits kills productivity. The spec _is_ the contract.

---

## Resolved Design Decisions

1. **Child Issue Creation:** When an oversized ticket is identified, the Architect prepares the breakdown and, upon human approval, programmatically creates the
   child issues on GitHub with the `ready-for-implementation` label and cross-links them.
2. **Deterministic Architecture Guard:** Architectural invariants are verified via a dedicated npm script (`pnpm check:invariants`), ensuring tool-backed
   enforcement rather than relying only on LLM inspection.
