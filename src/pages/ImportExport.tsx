import { ExportData } from "@/components/ExportData";
import { ImportData } from "@/components/ImportData";
import { Group } from "@mantine/core";

export function ImportExport() {
  return (
    <Group>
      <ExportData />
      <ImportData />
    </Group>
  );
}
