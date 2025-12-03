import { db } from "@/store";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { importDB } from "dexie-export-import";

export function ImportData() {
  async function importDatabase() {}

  return (
    <Button
      size="compact-xs"
      color="grey"
      onClick={importDatabase}
      data-testid="button-import-data"
    >
      Import Data
    </Button>
  );
}
