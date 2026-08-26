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
  const normalized = JSON.parse(JSON.stringify(importData));
  const tables = normalized?.data?.tables as DexieExportTable[] | undefined;

  if (!Array.isArray(tables)) {
    return normalized;
  }

  const tasksTable = getTable(tables, "tasks");
  const projectsTable = getTable(tables, "projects");

  if (!tasksTable || !projectsTable) {
    return normalized;
  }

  const projectNameToId = new Map<string, string>();

  projectsTable.rows = (projectsTable.rows || []).map((row) => {
    const project = row[1] || {};
    const name = (project.name || "").trim();
    const id =
      typeof project.id === "string"
        ? project.id
        : project.id != null
          ? String(project.id)
          : crypto.randomUUID();

    project.id = id;
    row[1] = project;
    row[0] = id;

    if (name) {
      projectNameToId.set(name, id);
    }

    return row;
  });

  const ensureProjectId = (projectName?: string): string => {
    const normalizedName = (projectName || "").trim() || "Migrated Project";
    const existingId = projectNameToId.get(normalizedName);
    if (existingId) {
      return existingId;
    }

    const id = crypto.randomUUID();
    projectNameToId.set(normalizedName, id);
    projectsTable.rows = projectsTable.rows || [];
    projectsTable.rows.push([id, { id, name: normalizedName }]);
    projectsTable.rowCount = projectsTable.rows.length;
    return id;
  };

  tasksTable.rows = (tasksTable.rows || []).map((row) => {
    const task = row[1] || {};
    const projectName = (task.project || "").trim();
    const projectId =
      typeof task.projectId === "string"
        ? task.projectId
        : task.projectId != null
          ? String(task.projectId)
          : ensureProjectId(projectName);
    const taskId =
      typeof task.id === "string"
        ? task.id
        : task.id != null
          ? String(task.id)
          : crypto.randomUUID();

    task.id = taskId;
    task.projectId = projectId;
    task.project = projectName || "Migrated Project";

    row[0] = taskId;
    row[1] = task;
    return row;
  });

  projectsTable.schema = "++id, &name";
  tasksTable.schema = "++id, date, timeStart, timeEnd, projectId, project";

  // Drop legacy comments tables because comment suggestions are now derived from tasks.
  normalized.data.tables = tables.filter((table) => table.name !== "comments");

  return normalized;
}

/**
 * Fallback importer for legacy payloads that cannot be processed by `importInto`.
 *
 * It reads table rows from the normalized export object, validates row shapes, and
 * bulk-inserts typed entities directly into Dexie tables.
 */
async function importTablesFallback(importData: any) {
  const tables = importData?.data?.tables as DexieExportTable[] | undefined;
  if (!Array.isArray(tables)) {
    throw new Error("Invalid backup table structure");
  }

  /**
   * Returns raw row payload objects (`row[1]`) for a given exported table.
   */
  const getRows = (tableName: string) => {
    const table = getTable(tables, tableName);
    return (table?.rows || []).map((row) => row[1]).filter(Boolean);
  };

  /**
   * Validates and converts a raw object into a Project entity.
   */
  const asProject = (value: Record<string, any>): Project | null => {
    if (typeof value.id !== "string" || typeof value.name !== "string") {
      return null;
    }
    return { id: value.id, name: value.name };
  };

  /**
   * Validates and converts a raw object into a Task entity.
   */
  const asTask = (value: Record<string, any>): Task | null => {
    if (
      typeof value.id !== "string" ||
      typeof value.date !== "string" ||
      typeof value.timeStart !== "string" ||
      typeof value.projectId !== "string"
    ) {
      return null;
    }

    return {
      id: value.id,
      date: value.date,
      timeStart: value.timeStart,
      timeEnd: typeof value.timeEnd === "string" ? value.timeEnd : undefined,
      projectId: value.projectId,
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

  const tasks = getRows("tasks")
    .map((row) => asTask(row))
    .filter((row): row is Task => row !== null);
  const projects = getRows("projects")
    .map((row) => asProject(row))
    .filter((row): row is Project => row !== null);
  const overtime = getRows("overtime")
    .map((row) => asOvertime(row))
    .filter((row): row is Overtime => row !== null);
  const settings = getRows("settings")
    .map((row) => asSettings(row))
    .filter((row): row is Settings => row !== null);

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
      // Read the file
      const fileContent = await file.text();
      const importData = JSON.parse(fileContent);

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

      // Clear all tables instead of deleting the database
      await db.tasks.clear();
      await db.projects.clear();
      await db.overtime.clear();
      await db.settings.clear();
      // Import the data with progress tracking
      const blob = new Blob([normalizedFileContent], {
        type: "application/json",
      });
      try {
        await importInto(db, blob);
      } catch {
        await importTablesFallback(normalizedImportData);
      }

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
              the imported data. All existing tasks and projects will be deleted.
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
