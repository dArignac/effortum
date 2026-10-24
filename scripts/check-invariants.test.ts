import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  checkDayjsUsage,
  checkDexieMigrations,
  checkDirectDexieAccess,
  checkSuppressedTestsAndTypes,
  formatViolations,
  FROZEN_DEXIE_VERSIONS,
  stripComments,
} from "./check-invariants";

describe("check-invariants", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "effortum-invariants-test-"),
    );
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("stripComments", () => {
    it("strips line comments and block comments while preserving length", () => {
      const code = "const a = 1; // comment\n/* block\ncomment */ const b = 2;";
      const stripped = stripComments(code);
      expect(stripped).not.toContain("// comment");
      expect(stripped).not.toContain("/* block");
      expect(stripped).toContain("const a = 1;");
      expect(stripped).toContain("const b = 2;");
    });
  });

  describe("Rule 1: no-direct-dexie-in-ui", () => {
    it("allows standard UI components that import from store", () => {
      const compDir = path.join(tempDir, "src", "components");
      fs.mkdirSync(compDir, { recursive: true });
      fs.writeFileSync(
        path.join(compDir, "GoodComponent.tsx"),
        'import { useEffortumStore } from "@/store";\nexport function Good() { return null; }',
      );

      const violations = checkDirectDexieAccess(tempDir);
      expect(violations).toHaveLength(0);
    });

    it("flags components that import directly from dexie or db", () => {
      const compDir = path.join(tempDir, "src", "components");
      fs.mkdirSync(compDir, { recursive: true });
      fs.writeFileSync(
        path.join(compDir, "BadComponent.tsx"),
        'import Dexie from "dexie";\nimport { EffortumDB } from "@/db";\nexport function Bad() { return null; }',
      );

      const violations = checkDirectDexieAccess(tempDir);
      expect(violations.length).toBeGreaterThanOrEqual(2);
      expect(violations[0].rule).toBe("no-direct-dexie-in-ui");
      expect(violations[0].file).toContain("BadComponent.tsx");
    });

    it("respects the whitelist for ExportData and ImportData", () => {
      const compDir = path.join(tempDir, "src", "components");
      fs.mkdirSync(compDir, { recursive: true });
      fs.writeFileSync(
        path.join(compDir, "ExportData.tsx"),
        'import { db } from "@/store";\nimport Dexie from "dexie";',
      );

      const violations = checkDirectDexieAccess(tempDir, [
        "src/components/ExportData.tsx",
      ]);
      expect(violations).toHaveLength(0);
    });
  });

  describe("Rule 2: enforce-dayjs", () => {
    it("allows dayjs in production code", () => {
      const srcDir = path.join(tempDir, "src");
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(
        path.join(srcDir, "goodTime.ts"),
        'import dayjs from "dayjs";\nexport const now = dayjs().format("YYYY-MM-DD");',
      );

      const violations = checkDayjsUsage(tempDir);
      expect(violations).toHaveLength(0);
    });

    it("flags raw new Date() in application code", () => {
      const srcDir = path.join(tempDir, "src");
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(
        path.join(srcDir, "badTime.ts"),
        "export const now = new Date().toISOString();",
      );

      const violations = checkDayjsUsage(tempDir);
      expect(violations).toHaveLength(1);
      expect(violations[0].rule).toBe("enforce-dayjs");
      expect(violations[0].file).toBe("src/badTime.ts");
    });

    it("ignores new Date() in test files and generated files", () => {
      const srcDir = path.join(tempDir, "src");
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(
        path.join(srcDir, "time.test.ts"),
        "const d = new Date();",
      );
      fs.writeFileSync(
        path.join(srcDir, "routeTree.gen.ts"),
        "const d = new Date();",
      );

      const violations = checkDayjsUsage(tempDir);
      expect(violations).toHaveLength(0);
    });
  });

  describe("Rule 3: dexie-migration-immutability", () => {
    it("passes against the project's actual src/db.ts", () => {
      const violations = checkDexieMigrations();
      expect(violations).toHaveLength(0);
    });

    it("flags an error if any historical version (1..7) is missing", () => {
      const dummyDbPath = path.join(tempDir, "db.ts");
      fs.writeFileSync(
        dummyDbPath,
        "class DB { constructor() { this.version(1); this.version(2); } }",
      );

      const violations = checkDexieMigrations(dummyDbPath);
      expect(violations.length).toBe(FROZEN_DEXIE_VERSIONS.length - 2);
      expect(violations[0].rule).toBe("dexie-migration-immutability");
      expect(violations[0].message).toContain("this.version(3)");
    });
  });

  describe("Rule 4: no-suppressed-tests-or-types", () => {
    it("allows standard clean code", () => {
      const srcDir = path.join(tempDir, "src");
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(
        path.join(srcDir, "valid.ts"),
        "export function add(a: number, b: number) { return a + b; }",
      );

      const violations = checkSuppressedTestsAndTypes(tempDir);
      expect(violations).toHaveLength(0);
    });

    it("flags @ts-ignore and @ts-nocheck in application files", () => {
      const srcDir = path.join(tempDir, "src");
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(
        path.join(srcDir, "ignored.ts"),
        "// @ts-ignore\nconst x: number = 'test';",
      );

      const violations = checkSuppressedTestsAndTypes(tempDir);
      expect(violations).toHaveLength(1);
      expect(violations[0].rule).toBe("no-suppressed-tests-or-types");
      expect(violations[0].message).toContain("@ts-ignore");
    });

    it("flags test.skip, it.skip, describe.skip, and test.only in test suites", () => {
      const e2eDir = path.join(tempDir, "e2e");
      fs.mkdirSync(e2eDir, { recursive: true });
      fs.writeFileSync(
        path.join(e2eDir, "sample.spec.ts"),
        "test.skip('skipped test', () => {});\nit.only('isolated test', () => {});",
      );

      const violations = checkSuppressedTestsAndTypes(tempDir);
      expect(violations).toHaveLength(2);
      expect(violations[0].message).toContain("test.skip");
      expect(violations[1].message).toContain("it.only");
    });

    it("respects the whitelist for generated route tree", () => {
      const srcDir = path.join(tempDir, "src");
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(
        path.join(srcDir, "routeTree.gen.ts"),
        "// @ts-nocheck\nexport const route = {};",
      );

      const violations = checkSuppressedTestsAndTypes(tempDir);
      expect(violations).toHaveLength(0);
    });
  });

  describe("formatViolations", () => {
    it("formats violations with expected tags and structure", () => {
      const formatted = formatViolations([
        {
          rule: "enforce-dayjs",
          file: "src/sample.ts",
          line: 42,
          message: "Use dayjs",
        },
      ]);
      expect(formatted).toBe(
        "[FAIL] [enforce-dayjs] src/sample.ts:42 - Use dayjs",
      );
    });
  });
});
