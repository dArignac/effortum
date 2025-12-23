import { Group } from "@mantine/core";
import { ExportData } from "./ExportData";
import { ImportData } from "./ImportData";

export function ImportExport() {
  return (
    <Group>
      <ExportData />
      <ImportData />
    </Group>
  );
}
