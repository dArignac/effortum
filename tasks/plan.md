# Implementation Plan: Invariant Guard (`invariant-guard`)

## Overview

Implement the deterministic architectural invariant checker (`scripts/check-invariants.ts`), its unit test suite (`scripts/check-invariants.test.ts`),
`package.json` script registration (`pnpm check:invariants`), and developer guidance in `AGENTS.md`.

## Dependency Graph

```
check-invariants.ts (Rule Engine & Checks)
          │
          ▼
check-invariants.test.ts (Vitest Test Suite)
          │
          ▼
package.json ("check:invariants" script)
          │
          ▼
Verification & AGENTS.md Documentation Update
```

## Implementation Order

1. **Rule Engine & Rules (`scripts/check-invariants.ts`):**
   - File traversal utility targeting `src/` and test paths.
   - Rule 1: `no-direct-dexie-in-ui` (components/pages/routes check with whitelist for `ExportData.tsx` and `ImportData.tsx`).
   - Rule 2: `enforce-dayjs` (flags raw `new Date()` in production code).
   - Rule 3: `dexie-migration-immutability` (verifies historical versions 1..7 in `src/db.ts` remain intact).
   - Rule 4: `no-suppressed-tests-or-types` (flags `@ts-ignore`, `@ts-nocheck`, `it.skip`, `test.skip`, `describe.skip`, `.only`).
   - CLI runner with formatted terminal output and exit code management (0 = pass, 1 = violations).

2. **Unit Tests (`scripts/check-invariants.test.ts`):**
   - Unit tests covering each rule with both passing snippets and failing violations.
   - Verify exact violation reporting (rule name, file, line, advice).

3. **Package Script Registration (`package.json`):**
   - Add `"check:invariants": "node --experimental-strip-types scripts/check-invariants.ts"`.
   - Run verification across the current repository to ensure green baseline.

4. **Documentation Sync (`AGENTS.md`):**
   - Add section on **Architectural Invariant Enforcement** to `AGENTS.md`.
   - Document the 4 update triggers for keeping the guard synchronized with `docs/architecture.md`.

## Risks & Mitigations

- **Risk:** False positives on comments or documentation containing `new Date()` or `dexie`.
  - _Mitigation:_ Strip comments prior to pattern matching or match import AST patterns.
- **Risk:** Node 26 strip-types compatibility with complex TypeScript constructs.
  - _Mitigation:_ Use clean TypeScript types/interfaces without unsupported runtime TypeScript features (e.g. enums/namespaces).

## Verification Checkpoints

1. `pnpm test scripts/check-invariants.test.ts` passes with 100% rule coverage.
2. `pnpm check:invariants` executes in <500ms and exits with code 0 on the repo.
3. Prettier formats all files cleanly.
