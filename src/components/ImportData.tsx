import { db } from "@/store";
import { Button, Group, Loader, Modal, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { importInto } from "dexie-export-import";
import { useRef, useState } from "react";

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

      // Clear all tables instead of deleting the database
      await db.tasks.clear();
      await db.projects.clear();
      await db.comments.clear();
      // Import the data with progress tracking
      const blob = new Blob([fileContent], { type: "application/json" });
      await importInto(db, blob);

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
            <Loader color="purple" />
          </>
        )}
      </Modal>
    </>
  );
}
