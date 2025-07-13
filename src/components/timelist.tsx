import { Table } from "@mantine/core";
import { AddEntry } from "./add-entry";

export function TimeList() {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Date</Table.Th>
          <Table.Th>Time Start</Table.Th>
          <Table.Th>Time End</Table.Th>
          <Table.Th>Project</Table.Th>
          <Table.Th>Comment</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        <AddEntry />
      </Table.Tbody>
    </Table>
  );
}
