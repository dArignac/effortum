import { db } from "@/store";
import { Button, Group, Loader, Modal, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { importInto } from "dexie-export-import";
import { useRef, useState } from "react";
import { Overtime } from "../models/Overtime";
import { Project } from "../models/Project";
import { Settings } from "../models/Settings";
import { Task } from "../models/Task";

type DexieExportTable = {
  name: string;
  schema?: string;
  rowCount?: number;
  rows?: Array<[unknown, Record<string, any>]>;
};

type DexieExportDataBlock = {
  tableName: string;
  inbound?: boolean;
  rows?: Array<Record<string, any>>;
};

type ImportTableSummary = {
  name: string;
  schema?: string;
  rowCount: number;
  sample?: Record<string, unknown>;
};

/**
 * Builds a compact table summary for import diagnostics.
 */
function summarizeTables(tables: DexieExportTable[]): ImportTableSummary[] {
  return tables.map((table) => {
    const rows = table.rows || [];
    return {
      name: table.name,
      schema: table.schema,
      rowCount:
        typeof table.rowCount === "number" ? table.rowCount : rows.length,
      sample: rows[0]?.[1],
    };
  });
}

/**
 * Returns all row payload objects for a table across known Dexie export shapes.
 */
function getTableRowObjects(
  importData: any,
  tableName: string,
): Record<string, any>[] {
  const tables = importData?.data?.tables as DexieExportTable[] | undefined;
  const tableRows = tables?.find((t) => t.name === tableName)?.rows;

  if (Array.isArray(tableRows) && tableRows.length > 0) {
    const firstRow = tableRows[0];
    if (Array.isArray(firstRow)) {
      return tableRows
        .map((row) => row?.[1])
        .filter(
          (row): row is Record<string, any> => !!row && typeof row === "object",
        );
    }
  }

  const dataBlocks = importData?.data?.data as
    DexieExportDataBlock[] | undefined;
  const rowsFromDataBlock = dataBlocks?.find(
    (block) => block.tableName === tableName,
  )?.rows;

  if (!Array.isArray(rowsFromDataBlock)) {
    return [];
  }

  return rowsFromDataBlock.filter(
    (row): row is Record<string, any> => !!row && typeof row === "object",
  );
}

/**
 * Writes normalized rows back to both Dexie export shapes to maximize importer compatibility.
 */
function setTableRows(
  importData: any,
  tableName: string,
  rows: Record<string, any>[],
) {
  const tables = (importData?.data?.tables || []) as DexieExportTable[];
  const table = tables.find((entry) => entry.name === tableName);
  if (table) {
    table.rows = rows.map((row) => [row.id ?? crypto.randomUUID(), row]);
    table.rowCount = rows.length;
  }

  const dataBlocks = (importData?.data?.data || []) as DexieExportDataBlock[];
  const block = dataBlocks.find((entry) => entry.tableName === tableName);
  if (block) {
    block.rows = rows;
  } else {
    dataBlocks.push({ tableName, inbound: true, rows });
  }

  importData.data.data = dataBlocks;
}

/**
 * Logs current persisted row counts for quick import diagnostics.
 */
async function logDbCounts(stage: string) {
  const [tasks, projects, overtime, settings] = await Promise.all([
    db.tasks.count(),
    db.projects.count(),
    db.overtime.count(),
    db.settings.count(),
  ]);

  console.info(`[ImportData] ${stage} DB counts`, {
    tasks,
    projects,
    overtime,
    settings,
  });
}

/**
 * Converts unknown ID values into stable string IDs used by current entities.
 */
function toStableId(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return crypto.randomUUID();
}

/**
 * Returns a table entry by name from a parsed Dexie export payload.
 */
function getTable(tables: DexieExportTable[], name: string) {
  return tables.find((table) => table.name === name);
}

/**
 * Normalizes legacy backups that still store task relations by project name.
 *
 * The function backfills `projectId` for tasks, ensures projects have stable IDs, and
 * aligns table schemas with the current app format so newer import paths can consume
 * old exports. Legacy comments tables are ignored intentionally.
 */
function normalizeLegacyBackup(importData: any) {
  console.info("[ImportData] Normalizing backup payload", {
    sourceVersion: importData?.data?.databaseVersion,
    sourceTables: summarizeTables(importData?.data?.tables || []),
  });

  const normalized = JSON.parse(JSON.stringify(importData));
  const tables = normalized?.data?.tables as DexieExportTable[] | undefined;

  if (!Array.isArray(tables)) {
    console.warn("[ImportData] Normalization skipped: no tables array found");
    return normalized;
  }

  const tasksTable = getTable(tables, "tasks");
  let projectsTable = getTable(tables, "projects");

  if (!tasksTable) {
    console.warn("[ImportData] Normalization skipped: no tasks table found");
    return normalized;
  }

  if (!projectsTable) {
    console.warn(
      "[ImportData] Projects table missing in backup. Creating one from task project names.",
    );
    projectsTable = {
      name: "projects",
      schema: "++id, &name",
      rowCount: 0,
      rows: [],
    };
    tables.push(projectsTable);
  }

  const taskRows = getTableRowObjects(normalized, "tasks");
  const projectRows = getTableRowObjects(normalized, "projects");

  if (taskRows.length === 0 && projectRows.length === 0) {
    console.warn("[ImportData] Normalization skipped: no rows found in backup");
    return normalized;
  }

  const projectNameToId = new Map<string, string>();

  const normalizedProjects = projectRows.map((project) => {
    const name = (project.name || "").trim();
    const id = toStableId(project.id);
    project.id = id;

    if (name) {
      projectNameToId.set(name, id);
    }

    return {
      id,
      name: name || "Migrated Project",
    } as Project;
  });

  const ensureProjectId = (projectName?: string): string => {
    const normalizedName = (projectName || "").trim() || "Migrated Project";
    const existingId = projectNameToId.get(normalizedName);
    if (existingId) {
      return existingId;
    }

    const id = crypto.randomUUID();
    projectNameToId.set(normalizedName, id);
    normalizedProjects.push({ id, name: normalizedName });
    return id;
  };

  const normalizedTasks = taskRows.map((task) => {
    const projectName = (task.project || "").trim();
    const projectId =
      typeof task.projectId === "string"
        ? task.projectId
        : task.projectId != null
          ? String(task.projectId)
          : ensureProjectId(projectName);
    const taskId = toStableId(task.id);

    return {
      ...task,
      id: taskId,
      projectId,
      project: projectName || "Migrated Project",
    };
  });

  projectsTable.schema = "++id, &name";
  tasksTable.schema = "++id, date, timeStart, timeEnd, projectId, project";
  setTableRows(normalized, "projects", normalizedProjects);
  setTableRows(normalized, "tasks", normalizedTasks);

  tasksTable.rowCount = normalizedTasks.length;
  projectsTable.rowCount = normalizedProjects.length;

  // Drop legacy comments tables because comment suggestions are now derived from tasks.
  normalized.data.tables = tables.filter((table) => table.name !== "comments");
  normalized.data.data = (normalized.data.data || []).filter(
    (table: DexieExportDataBlock) => table.tableName !== "comments",
  );

  console.info("[ImportData] Normalization completed", {
    normalizedVersion: normalized?.data?.databaseVersion,
    normalizedTables: summarizeTables(normalized.data.tables || []),
  });

  return normalized;
}

/**
 * Fallback importer for legacy payloads that cannot be processed by `importInto`.
 *
 * It reads table rows from the normalized export object, validates row shapes, and
 * bulk-inserts typed entities directly into Dexie tables.
 */
async function importTablesFallback(importData: any) {
  console.info("[ImportData] Running fallback import");
  const tables = importData?.data?.tables as DexieExportTable[] | undefined;
  if (!Array.isArray(tables)) {
    throw new Error("Invalid backup table structure");
  }

  console.info("[ImportData] Fallback source tables", {
    tables: summarizeTables(tables),
  });

  /**
   * Validates and converts a raw object into a Project entity.
   */
  const asProject = (value: Record<string, any>): Project | null => {
    if (typeof value.name !== "string") {
      return null;
    }
    return { id: toStableId(value.id), name: value.name };
  };

  /**
   * Validates and converts a raw object into a Task entity.
   */
  const asTask = (value: Record<string, any>): Task | null => {
    if (
      typeof value.date !== "string" ||
      typeof value.timeStart !== "string" ||
      !["string", "number"].includes(typeof value.projectId)
    ) {
      return null;
    }

    return {
      id: toStableId(value.id),
      date: value.date,
      timeStart: value.timeStart,
      timeEnd: typeof value.timeEnd === "string" ? value.timeEnd : undefined,
      projectId: String(value.projectId),
      project: typeof value.project === "string" ? value.project : undefined,
      comment: typeof value.comment === "string" ? value.comment : undefined,
    };
  };

  /**
   * Validates and converts a raw object into an Overtime entity.
   */
  const asOvertime = (value: Record<string, any>): Overtime | null => {
    if (
      typeof value.id !== "string" ||
      typeof value.currentBalance !== "number" ||
      typeof value.workingHoursPerDay !== "number"
    ) {
      return null;
    }

    return {
      id: value.id,
      currentBalance: value.currentBalance,
      workingHoursPerDay: value.workingHoursPerDay,
    };
  };

  /**
   * Validates and converts a raw object into a Settings entity.
   */
  const asSettings = (value: Record<string, any>): Settings | null => {
    if (
      typeof value.id !== "string" ||
      typeof value.roundToNearest5Minutes !== "boolean"
    ) {
      return null;
    }

    return {
      id: value.id,
      roundToNearest5Minutes: value.roundToNearest5Minutes,
    };
  };

  const tasks = getTableRowObjects(importData, "tasks")
    .map((row) => asTask(row))
    .filter((row): row is Task => row !== null);
  const projects = getTableRowObjects(importData, "projects")
    .map((row) => asProject(row))
    .filter((row): row is Project => row !== null);
  const overtime = getTableRowObjects(importData, "overtime")
    .map((row) => asOvertime(row))
    .filter((row): row is Overtime => row !== null);
  const settings = getTableRowObjects(importData, "settings")
    .map((row) => asSettings(row))
    .filter((row): row is Settings => row !== null);

  console.info("[ImportData] Fallback parsed entity counts", {
    tasks: tasks.length,
    projects: projects.length,
    overtime: overtime.length,
    settings: settings.length,
  });

  if (projects.length > 0) {
    await db.projects.bulkPut(projects);
  }
  if (tasks.length > 0) {
    await db.tasks.bulkPut(tasks);
  }
  if (overtime.length > 0) {
    await db.overtime.bulkPut(overtime);
  }
  if (settings.length > 0) {
    await db.settings.bulkPut(settings);
  }

  await logDbCounts("After fallback import");
}

export function ImportData() {
  const [confirmModalOpened, setConfirmModalOpened] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const selectedFileRef = useRef<File | null>(null);

  function handleFileSelect() {
    // Create a hidden file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        selectedFileRef.current = file;
        setConfirmModalOpened(true);
      }
    };

    input.click();
  }

  async function confirmImport() {
    const file = selectedFileRef.current;
    if (!file) return;

    setIsImporting(true);

    try {
      console.groupCollapsed("[ImportData] Import flow started");
      console.info("[ImportData] Selected file", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // Read the file
      const fileContent = await file.text();
      console.info("[ImportData] File read complete", {
        contentLength: fileContent.length,
      });

      const importData = JSON.parse(fileContent);
      console.info("[ImportData] Parsed backup metadata", {
        formatName: importData?.formatName,
        formatVersion: importData?.formatVersion,
        databaseName: importData?.data?.databaseName,
        databaseVersion: importData?.data?.databaseVersion,
      });

      // Validate it's a Dexie export
      if (
        importData.formatName !== "dexie" ||
        !importData.data?.databaseName ||
        !Array.isArray(importData.data?.tables) ||
        importData.data.databaseName !== "EffortumDatabase"
      ) {
        throw new Error("Invalid backup file format");
      }

      const normalizedImportData = normalizeLegacyBackup(importData);
      normalizedImportData.data.databaseVersion = db.verno;
      const normalizedFileContent = JSON.stringify(normalizedImportData);
      const expectedTaskCount = getTableRowObjects(
        normalizedImportData,
        "tasks",
      ).length;
      const expectedProjectCount = getTableRowObjects(
        normalizedImportData,
        "projects",
      ).length;

      console.info("[ImportData] Expected rows after normalization", {
        expectedTaskCount,
        expectedProjectCount,
      });

      await logDbCounts("Before clear");

      // Clear all tables instead of deleting the database
      await db.tasks.clear();
      await db.projects.clear();
      await db.overtime.clear();
      await db.settings.clear();

      await logDbCounts("After clear");

      // Import the data with progress tracking
      const blob = new Blob([normalizedFileContent], {
        type: "application/json",
      });
      try {
        console.info("[ImportData] Attempting importInto");
        await importInto(db, blob);
        console.info("[ImportData] importInto completed without throwing");
      } catch {
        console.warn(
          "[ImportData] importInto failed. Switching to fallback import",
        );
        await importTablesFallback(normalizedImportData);
      }

      await logDbCounts("After importInto/fallback attempt");

      const [importedTaskCount, importedProjectCount] = await Promise.all([
        db.tasks.count(),
        db.projects.count(),
      ]);

      // Some legacy payloads may pass importInto without errors but still import no rows.
      const requiresFallbackImport =
        (expectedTaskCount > 0 && importedTaskCount === 0) ||
        (expectedProjectCount > 0 && importedProjectCount === 0);

      console.info("[ImportData] Post-import verification", {
        importedTaskCount,
        importedProjectCount,
        requiresFallbackImport,
      });

      if (requiresFallbackImport) {
        console.warn(
          "[ImportData] Detected empty import result despite expected rows. Re-running fallback import.",
        );
        await db.tasks.clear();
        await db.projects.clear();
        await db.overtime.clear();
        await db.settings.clear();
        await importTablesFallback(normalizedImportData);
      }

      await logDbCounts("Final import result");

      notifications.show({
        message: "Database imported successfully! Reloading page...",
        color: "green",
      });

      setConfirmModalOpened(false);

      // Reload the page to refresh the Zustand store with imported data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Import failed:", error);
      notifications.show({
        message: `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        color: "red",
      });
    } finally {
      console.groupEnd();
      setIsImporting(false);
      selectedFileRef.current = null;
    }
  }

  return (
    <>
      <Button
        size="sm"
        onClick={handleFileSelect}
        data-testid="button-import-data"
        disabled={isImporting}
      >
        Import Data
      </Button>

      <Modal
        opened={confirmModalOpened}
        onClose={() => !isImporting && setConfirmModalOpened(false)}
        title="Confirm Database Import"
        data-testid="modal-import-confirm"
        closeOnClickOutside={!isImporting}
        closeOnEscape={!isImporting}
      >
        {!isImporting ? (
          <>
            <Text size="sm" mb="md">
              Warning: This will completely replace your current database with
              the imported data. All existing tasks and projects will be
              deleted.
            </Text>
            <Text size="sm" fw={700} mb="md">
              This action cannot be undone!
            </Text>
            <Group justify="flex-end" gap="sm">
              <Button
                variant="default"
                onClick={() => setConfirmModalOpened(false)}
                data-testid="button-import-cancel"
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={confirmImport}
                data-testid="button-import-confirm"
              >
                Replace Database
              </Button>
            </Group>
          </>
        ) : (
          <>
            <Text size="sm" mb="md">
              Importing database, please wait...
            </Text>
            <Loader color="purple" />
          </>
        )}
      </Modal>
    </>
  );
}
