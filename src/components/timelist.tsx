import { Table } from "@mantine/core";
import { useTasksContext } from "../contexts/TasksContext";
import { AddEntry } from "./add-entry";

export function TimeList() {
  const { tasks } = useTasksContext();

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
        {tasks.map((task) => (
          <Table.Tr key={task.id}>
            <Table.Td>{task.date}</Table.Td>
            <Table.Td>{task.timeStart}</Table.Td>
            <Table.Td>{task.timeEnd}</Table.Td>
            <Table.Td>{task.project}</Table.Td>
            <Table.Td>{task.comment}</Table.Td>
            <Table.Td>
              {/* Actions like edit or delete can be added here */}
            </Table.Td>
          </Table.Tr>
        ))}
        <AddEntry />
      </Table.Tbody>
    </Table>
  );
}
