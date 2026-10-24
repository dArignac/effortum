# Spec: Invariant Guard (`invariant-guard`)

## Objective

Provide a fast, deterministic CLI tool and npm script (`pnpm check:invariants`) that programmatically enforces Effortum's architectural invariants defined in
[AGENTS.md](../../../AGENTS.md) and [docs/architecture.md](../../../docs/architecture.md). It serves as the primary verification tool for the Auditor subagent
and CI, preventing regressions in state management, database migrations, date handling, and test integrity.

## Tech Stack

- TypeScript 7.0+
- Node.js v26 native execution (`node --experimental-strip-types`)
- Vitest 5.0+ for unit tests

## Commands

- **Run Invariant Checks:** `pnpm check:invariants` (executes `node --experimental-strip-types scripts/check-invariants.ts`)
- **Run Invariant Unit Tests:** `pnpm test scripts/check-invariants.test.ts`
- **Full Verification:** `pnpm check:invariants && pnpm test && pnpm test:e2e`

## Project Structure

```
scripts/
├── check-invariants.ts          # Core invariant verification logic & CLI runner
└── check-invariants.test.ts     # Vitest unit tests verifying detection of all invariant violations
package.json                     # Adds "check:invariants" script entry
docs/specs/autonomous-issue-pipeline/
├── CAPABILITY-MAP.md            # Initiative capability index
└── SPEC-invariant-guard.md      # This specification
```

## Invariant Rules to Enforce

1. **Rule 1 (`no-direct-dexie-in-ui`):**
   - UI components and pages (`src/components/`, `src/pages/`, `src/routes/`) must access data exclusively through the Zustand store slices.
   - Prohibits importing `dexie`, `src/db`, or `@/db`.
   - _Allowed Exceptions:_ `src/components/ExportData.tsx` and `src/components/ImportData.tsx` (database backup and import functionality).

2. **Rule 2 (`enforce-dayjs`):**
   - All date and time operations across `src/` must use `dayjs`.
   - Flags usage of raw `new Date()` in application code (`src/` excluding test files `*.test.ts`, `*.spec.ts`, and backup filename generation in
     `ExportData.tsx`).

3. **Rule 3 (`dexie-migration-immutability`):**
   - In `src/db.ts`, historical database versions (e.g. `version(1)` through `version(7)`) must never be modified in-place.
   - Any schema changes must append a new `version(N + 1)` block with proper migration logic.

4. **Rule 4 (`no-suppressed-tests-or-types`):**
   - Prohibits introducing `@ts-ignore`, `@ts-nocheck`, `it.skip(`, `test.skip(`, `describe.skip(`, `it.only(`, `test.only(`, or `describe.only(`.
   - Guarantees test and type integrity cannot be quietly bypassed to pass automated gates.

## Code Style

```typescript
export interface InvariantViolation {
  rule: string;
  file: string;
  line: number;
  message: string;
}

export interface InvariantResult {
  passed: boolean;
  violations: InvariantViolation[];
}

export function formatViolations(violations: InvariantViolation[]): string {
  return violations.map((v) => `[FAIL] [${v.rule}] ${v.file}:${v.line} - ${v.message}`).join("\n");
}
```

## Testing Strategy

- **Framework:** Vitest (`scripts/check-invariants.test.ts`).
- **Test Scenarios:**
  - Positive test: Passes on valid components, stores, and test files.
  - Negative test (Rule 1): Fails when a dummy component in `src/components/` imports `dexie` or `src/db`.
  - Negative test (Rule 2): Fails when `new Date()` is detected in production code outside permitted exceptions.
  - Negative test (Rule 3): Detects if an existing version block in `src/db.ts` is altered.
  - Negative test (Rule 4): Fails when `it.skip` or `@ts-ignore` is present.
- **Coverage Expectation:** 100% logic coverage across the rule evaluation functions.

## Boundaries

- **Always:**
  - Exit with code `0` on clean pass, code `1` on any invariant violation.
  - Report exact file path, line number, rule name, and clear resolution advice for every failure.
  - Keep execution time under 1 second.
- **Ask First:**
  - Adding any new permanent file exceptions to the architectural rules.
- **Never:**
  - Allow violations to silently degrade to warnings without user intervention.
  - Rely on network or external services.

## Success Criteria

- [ ] `pnpm check:invariants` script is registered in `package.json` and runs via `node --experimental-strip-types scripts/check-invariants.ts`.
- [ ] `pnpm check:invariants` exits with code `0` on the current clean repository.
- [ ] All unit tests in `scripts/check-invariants.test.ts` pass cleanly via `pnpm test`.
- [ ] Auditor subagent can execute `pnpm check:invariants` as a deterministic verification gate.
- [ ] `AGENTS.md` is updated with an explicit instruction mandating updates to `scripts/check-invariants.ts` when architectural invariants change.

## Rule Lifecycle & Synchronization with Architecture

To ensure the invariant guard does not become stale or out of sync with [docs/architecture.md](../../../docs/architecture.md) and
[AGENTS.md](../../../AGENTS.md), the following lifecycle triggers are established:

### Triggers for Updating Guard Rules

1. **New or Changed Architectural Constraints:** Whenever a change to [docs/architecture.md](../../../docs/architecture.md) or [AGENTS.md](../../../AGENTS.md)
   introduces a new rule (e.g., prohibiting a specific library, enforcing a layer boundary, or establishing a coding standard), a corresponding programmatic
   rule must be added to `scripts/check-invariants.ts` with matching test cases in `scripts/check-invariants.test.ts`.
2. **Dexie Migration Bumps:** When a new schema migration is merged in `src/db.ts` (e.g. bumping to `version(8)`), the baseline of frozen versions in Rule 3
   must be incremented to include version 8 as an immutable historical version.
3. **New Architectural Exceptions:** If a new legitimate exception is approved by the human during Gate 1 (e.g., a new data migration utility that needs direct
   Dexie access), it must be explicitly added to the rule's allowed file whitelist in `scripts/check-invariants.ts`.
4. **Structural Directory Changes:** Adding or reorganizing layer folders (e.g. new domain directories) requires updating path resolution targets in the
   checker.

### Auditor Subagent Synchronization Check

During Phase 3 of the issue implementation pipeline, the Auditor subagent performs a bidirectional check:

- If `docs/architecture.md` was modified in the diff, the Auditor checks whether `scripts/check-invariants.ts` was also evaluated and updated.
- If an architectural invariant was added or altered without updating `scripts/check-invariants.ts`, the Auditor flags it in `audit-report.md` before approving
  the PR.

## Open Questions

- None. Lifecycle and synchronization triggers are fully specified.
