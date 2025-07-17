import { ActionIcon, Table } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { useField } from "@mantine/form";
import { IconPencilCheck } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useTasksContext } from "../contexts/TasksContext";
import { StopEntry } from "./StopEntry";

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
        <ActionIcon variant="default" size="sm" aria-label="Update Task">
          <IconPencilCheck />
        </ActionIcon>{" "}
        {/* FIXME maybe move the stop entry code here as well, also it does not re-render currently */}
        <StopEntry taskId={task.id} />
      </Table.Td>
    </Table.Tr>
  );
}
