import { Space, Table } from "@mantine/core";
import { useMemo } from "react";
import { useEffortumStore } from "../store";
import { AddEntryRow } from "./AddEntry";
import { TaskListRow } from "./TaskListRow";
import { Task } from "../models/Task";
import dayjs from "dayjs";

function compareTasksByTimeStart(a: Task, b: Task) {
  const dateTimeA = dayjs(`${a.date} ${a.timeStart}`, "YYYY-MM-DD HH:mm");
  const dateTimeB = dayjs(`${b.date} ${b.timeStart}`, "YYYY-MM-DD HH:mm");
  return dateTimeA.valueOf() - dateTimeB.valueOf();
}

export function TaskList() {
  const tasks = useEffortumStore((state) => state.tasks);
  const sortedTasks = useMemo(() => {
    return [...tasks].sort(compareTasksByTimeStart);
  }, [tasks]);

  const canAddTask = useMemo(() => {
    return !tasks.some((task) => !task.timeEnd || task.timeEnd.length === 0);
  }, [tasks]);

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
        {sortedTasks.map((task) => (
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
