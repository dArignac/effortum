import { db } from "@/store";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { exportDB } from "dexie-export-import";

export function ExportData() {
  async function backupDatabase() {
    try {
      const blob = await exportDB(db);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `database-backup-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Backup failed:", error);
      notifications.show({
        message: "Creation of database backup failed.",
        color: "red",
      });
    }
  }

  return (
    <Button size="sm" onClick={backupDatabase} data-testid="button-export-data">
      Export Data
    </Button>
  );
}
