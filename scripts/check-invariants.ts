import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

/**
 * Recursively retrieves all files matching given extensions within a directory.
 */
export function getSourceFiles(
  dir: string,
  extensions: string[] = [".ts", ".tsx"],
): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name !== "node_modules" &&
        entry.name !== ".git" &&
        entry.name !== "dist"
      ) {
        results.push(...getSourceFiles(fullPath, extensions));
      }
    } else if (
      entry.isFile() &&
      extensions.some((ext) => entry.name.endsWith(ext))
    ) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Strips single-line and multi-line comments from text to avoid false positives.
 */
export function stripComments(content: string): string {
  return content.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, (match) =>
    " ".repeat(match.length),
  );
}

/**
 * Rule 1: no-direct-dexie-in-ui
 * UI components, pages, and routes must access data through Zustand store slices,
 * never by directly importing dexie or src/db.
 */
export function checkDirectDexieAccess(
  rootDir: string = process.cwd(),
  whitelist: string[] = [
    "src/components/ExportData.tsx",
    "src/components/ImportData.tsx",
  ],
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  const uiDirs = [
    path.join(rootDir, "src", "components"),
    path.join(rootDir, "src", "pages"),
    path.join(rootDir, "src", "routes"),
  ];

  const directImportRegex =
    /from\s+['"](?:dexie|.*[/@](?:src\/)?db(?:\.ts)?)['"]/i;

  for (const dir of uiDirs) {
    const files = getSourceFiles(dir);
    for (const file of files) {
      const relPath = path.relative(rootDir, file);
      if (whitelist.some((w) => relPath.replace(/\\/g, "/") === w)) {
        continue;
      }

      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        const uncommented = line.replace(/\/\/.*$/, "");
        if (directImportRegex.test(uncommented)) {
          violations.push({
            rule: "no-direct-dexie-in-ui",
            file: relPath,
            line: index + 1,
            message:
              "UI layer must not import Dexie or db directly. Access state and mutations via useEffortumStore slices.",
          });
        }
      });
    }
  }

  return violations;
}

/**
 * Rule 2: enforce-dayjs
 * Application code in src/ must use dayjs for date/time operations instead of raw new Date().
 */
export function checkDayjsUsage(
  rootDir: string = process.cwd(),
  whitelist: string[] = [],
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  const srcDir = path.join(rootDir, "src");
  const files = getSourceFiles(srcDir);

  const rawDateRegex = /\bnew\s+Date\s*\(/;

  for (const file of files) {
    const relPath = path.relative(rootDir, file).replace(/\\/g, "/");

    // Exclude test files, generated files, and explicitly whitelisted files
    if (
      relPath.endsWith(".test.ts") ||
      relPath.endsWith(".test.tsx") ||
      relPath.endsWith(".spec.ts") ||
      relPath.endsWith(".spec.tsx") ||
      relPath.endsWith(".gen.ts") ||
      whitelist.includes(relPath)
    ) {
      continue;
    }

    const content = fs.readFileSync(file, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const uncommented = line.replace(/\/\/.*$/, "");
      if (rawDateRegex.test(uncommented)) {
        violations.push({
          rule: "enforce-dayjs",
          file: relPath,
          line: index + 1,
          message:
            "Always use dayjs for time and date operations instead of raw new Date().",
        });
      }
    });
  }

  return violations;
}

/**
 * Baseline signatures for historical Dexie schema versions in src/db.ts (versions 1..7).
 */
export const FROZEN_DEXIE_VERSIONS = [1, 2, 3, 4, 5, 6, 7];

/**
 * Rule 3: dexie-migration-immutability
 * Historical versions 1..7 in src/db.ts must never be modified in-place.
 * Any schema updates must add a new version(N + 1).
 */
export function checkDexieMigrations(
  dbFilePath: string = path.join(process.cwd(), "src", "db.ts"),
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  if (!fs.existsSync(dbFilePath)) {
    violations.push({
      rule: "dexie-migration-immutability",
      file: dbFilePath,
      line: 1,
      message: "Database file src/db.ts not found.",
    });
    return violations;
  }

  const content = fs.readFileSync(dbFilePath, "utf-8");
  const lines = content.split("\n");

  for (const v of FROZEN_DEXIE_VERSIONS) {
    const versionCall = `this.version(${v})`;
    const foundLine = lines.findIndex((l) => l.includes(versionCall));
    if (foundLine === -1) {
      violations.push({
        rule: "dexie-migration-immutability",
        file: path.relative(process.cwd(), dbFilePath),
        line: 1,
        message: `Historical migration this.version(${v}) is missing from src/db.ts. Existing versions must remain immutable.`,
      });
    }
  }

  return violations;
}

/**
 * Rule 4: no-suppressed-tests-or-types
 * Prohibits introducing @ts-ignore, @ts-nocheck, it.skip, test.skip, describe.skip, .only
 */
export function checkSuppressedTestsAndTypes(
  rootDir: string = process.cwd(),
  whitelist: string[] = [
    "src/routeTree.gen.ts",
    "scripts/check-invariants.ts",
    "scripts/check-invariants.test.ts",
  ],
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  const targetDirs = [
    path.join(rootDir, "src"),
    path.join(rootDir, "e2e"),
    path.join(rootDir, "scripts"),
  ];

  const tsDirectiveRegex = /(?:\/\/|\/\*)\s*@ts-(?:ignore|nocheck)\b/;
  const testModifierRegex =
    /\b(?:it|test|describe)\.(?:skip|only)\s*\(|\b(?:fit|fdescribe)\s*\(/;

  for (const dir of targetDirs) {
    const files = getSourceFiles(dir);
    for (const file of files) {
      const relPath = path.relative(rootDir, file).replace(/\\/g, "/");
      if (whitelist.some((w) => relPath === w || relPath.endsWith(w))) {
        continue;
      }

      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        const tsMatch = tsDirectiveRegex.exec(line);
        if (tsMatch) {
          violations.push({
            rule: "no-suppressed-tests-or-types",
            file: relPath,
            line: index + 1,
            message: `Found compiler suppression '${tsMatch[0].trim()}'. Types must be fixed, not bypassed.`,
          });
        }

        const testMatch = testModifierRegex.exec(line);
        if (testMatch) {
          violations.push({
            rule: "no-suppressed-tests-or-types",
            file: relPath,
            line: index + 1,
            message: `Found skipped or focused test '${testMatch[0].trim()}'. Tests must not be skipped or isolated.`,
          });
        }
      });
    }
  }

  return violations;
}

/**
 * Runs all invariant rules and aggregates results.
 */
export function runAllInvariantChecks(
  rootDir: string = process.cwd(),
): InvariantResult {
  const violations: InvariantViolation[] = [
    ...checkDirectDexieAccess(rootDir),
    ...checkDayjsUsage(rootDir),
    ...checkDexieMigrations(path.join(rootDir, "src", "db.ts")),
    ...checkSuppressedTestsAndTypes(rootDir),
  ];

  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Formats violations for readable terminal output.
 */
export function formatViolations(violations: InvariantViolation[]): string {
  return violations
    .map((v) => `[FAIL] [${v.rule}] ${v.file}:${v.line} - ${v.message}`)
    .join("\n");
}

// CLI entry point
const isDirectExecution =
  process.argv[1] &&
  (path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) ||
    process.argv[1].endsWith("check-invariants.ts"));

if (isDirectExecution) {
  console.log("🔍 Checking Effortum architectural invariants...");
  const result = runAllInvariantChecks();

  if (result.passed) {
    console.log("✅ All architectural invariants passed!");
    console.log("   - no-direct-dexie-in-ui: OK");
    console.log("   - enforce-dayjs: OK");
    console.log("   - dexie-migration-immutability: OK");
    console.log("   - no-suppressed-tests-or-types: OK");
    process.exit(0);
  } else {
    console.error("❌ Architectural invariant violations detected:\n");
    console.error(formatViolations(result.violations));
    console.error(
      `\nFound ${result.violations.length} violation(s). Please resolve them before proceeding.`,
    );
    process.exit(1);
  }
}
