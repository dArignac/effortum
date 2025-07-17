import { ActionIcon, Table, TextInput } from "@mantine/core";
import { useTasksContext } from "../contexts/TasksContext";
import { StopEntry } from "./StopEntry";
import { IconPencilCheck } from "@tabler/icons-react";
import { useField } from "@mantine/form";
import { TimeInput } from "@mantine/dates";
import dayjs from "dayjs";

export function TaskListRow(props: { taskId: string }) {
  const { tasks } = useTasksContext();

  const task = tasks.find((task) => task.id === props.taskId);
  if (!task) {
    return null; // No action needed if task is not found
  }

  // FYI cant use form due to table
  const fieldStart = useField({
    initialValue: task.timeStart,
    validate: (value) => (value ? null : "Start time is required"),
  });

  const fieldEnd = useField({
    initialValue: task.timeEnd || "",
    validate: (value) => {
      if (value) {
        return dayjs(`${dayjs().format("YYYY-MM-DD")} ${value}`).isBefore(
          dayjs(`${dayjs().format("YYYY-MM-DD")} ${fieldStart.getValue()}`),
        )
          ? "End time must be after start time"
          : null;
      }
      return null;
    },
  });

  // FIXME all columns editable
  // FIXME centralize validation - is alreay in AddEntry -> maybe we can get rid of AddEntry and have it handled in this component

  return (
    <Table.Tr key={task.id}>
      <Table.Td>{task.date}</Table.Td>
      <Table.Td>
        <TimeInput size="xs" {...fieldStart.getInputProps()} />
      </Table.Td>
      <Table.Td>
        <TimeInput size="xs" {...fieldEnd.getInputProps()} />
      </Table.Td>
      <Table.Td>{task.project}</Table.Td>
      <Table.Td>{task.comment}</Table.Td>
      <Table.Td>
        {/* FIXME maybe move the stop entry code here as well */}
        <StopEntry taskId={task.id} />
        <ActionIcon variant="default" size="sm" aria-label="Update Task">
          <IconPencilCheck />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  );
}
