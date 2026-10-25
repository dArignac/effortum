# Plan: feat: make percentage value optional (#241)

## 1. Component Dependency Graph

```text
[Summary.tsx]
  ├── State: showPercentages (boolean, default: false)
  ├── Checkbox: "Show percentages" (data-testid="checkbox-show-percentages")
  └── Conditional Render: summary-percentage-* Box element
         ▲
         │ (End-to-End Verification)
         │
[Playwright E2E Tests]
  ├── e2e/issue-241.spec.ts (new: toggling, defaults, list-by-task interaction)
  └── e2e/issue-129.spec.ts (updated: activate percentage checkbox before assertions)
```

## 2. Implementation Order

1. **Component Update (`src/components/Summary.tsx`):**
   - Introduce `showPercentages` state hook: `const [showPercentages, setShowPercentages] = useState(false);`.
   - Update layout in table header row to render the "Show percentages" checkbox directly below "List by task".
   - Set margin bottom `mb={10}` on the "List by task" checkbox and `mb={20}` on "Show percentages" to maintain clean Mantine spacing.
   - Conditionally render `{showPercentages && (<Box data-testid={`summary-percentage-${item.label}`}>{formatPercentage(item.time, timeSum)}</Box>)}`.

2. **Test Updates (`e2e/issue-129.spec.ts` & `e2e/issue-241.spec.ts`):**
   - Update `e2e/issue-129.spec.ts` so that tests toggle `checkbox-show-percentages` before verifying percentages (and optionally assert that percentages are
     hidden beforehand).
   - Create `e2e/issue-241.spec.ts` with comprehensive scenarios:
     - Checkbox is rendered beneath "List by task" with label "Show percentages" and is unchecked by default.
     - With tasks recorded, no percentage elements exist when unchecked.
     - Clicking the checkbox causes percentages to appear.
     - Clicking it again hides them.
     - Toggling works correctly in "List by task" mode.

3. **Full Suite Verification:**
   - Execute `pnpm check:invariants` to verify architecture invariants.
   - Execute `pnpm test` for Vitest unit tests.
   - Execute `pnpm test:e2e` for Playwright E2E tests.
   - Execute `pnpm tsc --noEmit` and `pnpm prettier --check .`.

## 3. Risks & Mitigations

- **Risk:** Modifying `e2e/issue-129.spec.ts` could accidentally loosen existing test assertions.
  - **Mitigation:** Keep all percentage calculation checks identical in `issue-129.spec.ts`, adding only the interaction to enable "Show percentages", plus an
    explicit check that percentages were hidden prior to checking.
- **Risk:** Layout shift or alignment regression between duration and label.
  - **Mitigation:** The top vertical alignment (`verticalAlign: "top"`) on `Table.Td` remains in place; when percentages are hidden, the hours and project name
    remain cleanly aligned at the top.

## 4. Verification Checkpoints

- Checkpoint 1: Invariant check passed (`pnpm check:invariants`).
- Checkpoint 2: Typecheck passed (`pnpm tsc --noEmit`).
- Checkpoint 3: Unit tests pass (`pnpm test`).
- Checkpoint 4: E2E tests for issue 241 and issue 129 pass (`pnpm test:e2e e2e/issue-241.spec.ts e2e/issue-129.spec.ts`).
- Checkpoint 5: Full E2E suite passes (`pnpm test:e2e`).
- Checkpoint 6: Prettier format check passed (`pnpm prettier --check .`).
