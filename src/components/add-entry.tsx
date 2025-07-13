import { Table } from "@mantine/core";

export function AddEntry() {
  return (
    <Table.Tr>
      <Table.Td>
        <input type="date" />
      </Table.Td>
      <Table.Td>
        <input type="time" />
      </Table.Td>
      <Table.Td>
        <input type="time" />
      </Table.Td>
      <Table.Td>
        <input type="text" placeholder="Project Name" />
      </Table.Td>
      <Table.Td>
        <input type="text" placeholder="Comment" />
      </Table.Td>
      <Table.Td>
        <button>Add</button>
      </Table.Td>
    </Table.Tr>
  );
}
