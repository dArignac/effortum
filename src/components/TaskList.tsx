import { Space, Table } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { Task } from "../models/Task";
import { AddEntryRow } from "./AddEntry";
import { TaskListRow } from "./TaskListRow";
import { getTasks } from "../db";

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const canAddTask = useMemo(() => {
    return !tasks.some((task) => !task.timeEnd || task.timeEnd.length === 0);
  }, [tasks]);

  useEffect(() => {
    const fetchData = async () => {
      const loadedTasks = await getTasks();
      setTasks(loadedTasks);
    };
    fetchData();
  }, []);

  return (
    <Table stickyHeader stickyHeaderOffset={0}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Date</Table.Th>
          <Table.Th w={80}>Start</Table.Th>
          <Table.Th w={80}>End</Table.Th>
          <Table.Th>Project</Table.Th>
          <Table.Th>Comment</Table.Th>
          <Table.Th>Duration</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {tasks.map((task) => (
          <TaskListRow key={task.id} taskId={task.id} />
        ))}
        <Table.Tr>
          <Table.Td colSpan={6}>
            <Space h="md" />
          </Table.Td>
        </Table.Tr>
        {canAddTask && <AddEntryRow />}
      </Table.Tbody>
    </Table>
  );
}
