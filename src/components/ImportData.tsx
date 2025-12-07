import { db, useEffortumStore } from "@/store";
import { Button, Group, Modal, Progress, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { importDB } from "dexie-export-import";
import { useRef, useState } from "react";

export function ImportData() {
  const loadFromIndexedDb = useEffortumStore(
    (state) => state.loadFromIndexedDb,
  );
  const [confirmModalOpened, setConfirmModalOpened] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
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
    setImportProgress(0);

    try {
      // Read the file
      const fileContent = await file.text();
      const importData = JSON.parse(fileContent);

      // Validate it's a Dexie export
      if (importData.formatName !== "dexie") {
        throw new Error("Invalid backup file format");
      }

      setImportProgress(25);

      // Clear existing database
      await db.delete();
      setImportProgress(50);

      // Import the data with progress tracking
      const blob = new Blob([fileContent], { type: "application/json" });
      await importDB(blob, {
        progressCallback: (progress) => {
          // Map progress from 0-1 to 60-90%
          if (progress.totalRows && progress.totalRows > 0) {
            setImportProgress(
              60 + (progress.completedRows / progress.totalRows) * 30,
            );
          }
          return true; // Continue import
        },
      });

      setImportProgress(100);

      notifications.show({
        message: "Database imported successfully!",
        color: "green",
      });

      // TODO reload Zustand state

      setConfirmModalOpened(false);
    } catch (error) {
      console.error("Import failed:", error);
      notifications.show({
        message: `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        color: "red",
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
      selectedFileRef.current = null;
    }
  }

  return (
    <>
      <Button
        size="compact-xs"
        color="grey"
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
              the imported data. All existing tasks, projects, and comments will
              be deleted.
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
            <Progress
              value={importProgress}
              striped
              animated
              data-testid="import-progress"
            />
            <Text size="xs" c="dimmed" mt="xs" ta="center">
              {Math.round(importProgress)}%
            </Text>
          </>
        )}
      </Modal>
    </>
  );
}
