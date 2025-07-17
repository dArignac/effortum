import { Table } from "@mantine/core";
import { useTasksContext } from "../contexts/TasksContext";
import { TaskListRow } from "./TaskListRow";

export function TaskList() {
  const { tasks } = useTasksContext();

  return (
    <Table stickyHeader stickyHeaderOffset={0}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Date</Table.Th>
          <Table.Th w={80}>Start</Table.Th>
          <Table.Th w={80}>End</Table.Th>
          <Table.Th>Project</Table.Th>
          <Table.Th>Comment</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {tasks.map((task) => (
          <TaskListRow key={task.id} taskId={task.id} />
        ))}
      </Table.Tbody>
    </Table>
  );
}
