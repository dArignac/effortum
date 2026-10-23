# Task List: Invariant Guard (`invariant-guard`)

## Task 1: Create Core Invariant Rules & CLI Runner
- [x] **Description:** Implement `scripts/check-invariants.ts` containing the modular rule engine and 4 invariant checks (`no-direct-dexie-in-ui`, `enforce-dayjs`, `dexie-migration-immutability`, `no-suppressed-tests-or-types`) with CLI runner and formatted output.
- **Acceptance criteria:**
  - Exports modular rule checking functions for testability.
  - Formats violations with `[FAIL] [rule] file:line - message`.
  - Exits with code 0 if no violations, code 1 if violations found.
- **Verification:** Run `node --experimental-strip-types scripts/check-invariants.ts` manually to verify baseline execution.
- **Files touched:**
  - `scripts/check-invariants.ts`

## Task 2: Create Vitest Unit Tests for Invariant Rules
- [x] **Description:** Implement `scripts/check-invariants.test.ts` to test each rule against valid and violating code snippets, verifying that violations are accurately detected and whitelisted files are respected.
- **Acceptance criteria:**
  - Test suite passes with full test coverage for all 4 rules.
  - Whitelist handling for `ExportData.tsx` and `ImportData.tsx` verified.
  - Negative tests verify line number and violation message accuracy.
- **Verification:** `pnpm test scripts/check-invariants.test.ts` (14/14 tests pass)
- **Files touched:**
  - `scripts/check-invariants.test.ts`

## Task 3: Register `check:invariants` in package.json & Run Full Suite
- [x] **Description:** Add the `check:invariants` command to `package.json` scripts and run the complete verification suite (`pnpm check:invariants`, `pnpm test`, `pnpm test:e2e`).
- **Acceptance criteria:**
  - `package.json` has `"check:invariants": "node --experimental-strip-types scripts/check-invariants.ts"`.
  - `pnpm check:invariants` executes in <1 second and passes with code 0 on the repo.
- **Verification:** `pnpm check:invariants && pnpm test && pnpm test:e2e` (all green)
- **Files touched:**
  - `package.json`

## Task 4: Document Invariant Guard in AGENTS.md
- [x] **Description:** Add the **Architectural Invariant Enforcement** section to `AGENTS.md` detailing how to run `pnpm check:invariants`, and listing the 4 explicit triggers for when developers or agents must update `scripts/check-invariants.ts`.
- **Acceptance criteria:**
  - `AGENTS.md` includes the command, purpose, and the 4 synchronization triggers.
  - Documentation integrity preserved.
- **Verification:** `pnpm prettier --check AGENTS.md`
- **Files touched:**
  - `AGENTS.md`
