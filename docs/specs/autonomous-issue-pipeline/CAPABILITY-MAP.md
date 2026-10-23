# Capability Map: Autonomous Issue Implementation Pipeline

Source: [docs/ideas/autonomous-issue-pipeline.md](../../ideas/autonomous-issue-pipeline.md)

| Module id | Responsibility | Depends on |
|---|---|---|
| `invariant-guard` | Deterministic verification script (`scripts/check-invariants.ts`, registered as `pnpm check:invariants`) and unit tests (`scripts/check-invariants.test.ts`). Verifies Dexie import boundaries (no direct Dexie in `src/components/` or `src/pages/`), `dayjs` usage (no naked `new Date()`), Dexie migration version increment check in `src/db.ts`, and test integrity. | — |
| `issue-pipeline-skill` | Antigravity workflow skill (`skills/implement-issue/SKILL.md`), subagent definitions (`builder`, `auditor`), GitHub issue triage & automated child issue creation for splits, spec directory structuring (`docs/specs/issue-<id>-<slug>/`), and documentation sync in `AGENTS.md` and `docs/architecture.md`. | `invariant-guard` |

Build order: `invariant-guard` → `issue-pipeline-skill`
