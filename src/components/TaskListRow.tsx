import { ActionIcon, Autocomplete, Table, TextInput } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { useField } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconClockPause, IconPencilCheck } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useProjectsContext } from "../contexts/ProjectsContext";
import { useTasksContext } from "../contexts/TasksContext";
import {
  validateDate,
  validateEnd,
  validateProject,
  validateStart,
} from "../validations";
import { DateField } from "./DateField";

export function TaskListRow(props: { taskId: string | null }) {
  const { tasks, setTasks } = useTasksContext();
  const { projects, setProjects } = useProjectsContext();
  const [dateValue, setDateValue] = useState<string | null>(null);
  const [canStopTask, setCanStopTask] = useState(false);

  const task = tasks.find((task) => task.id === props.taskId);
  if (!task) {
    return null;
  }

  useEffect(() => {
    setDateValue(task.date);
  }, [task.date]);

  useEffect(() => {
    setCanStopTask(!task.timeEnd || task.timeEnd.length === 0);
  }, [task.timeEnd]);

  // FYI cant use form due to table
  const fieldDate = useField({
    initialValue: task.date,
    validate: validateDate,
    onValueChange: (value) => setDateValue(value),
  });

  const fieldStart = useField({
    initialValue: task.timeStart,
    validate: validateStart,
  });

  const fieldEnd = useField({
    initialValue: task.timeEnd || "",
    validate: (value) => validateEnd(value, fieldStart.getValue()),
  });

  const fieldProject = useField({
    initialValue: task.project,
    validate: (value) => validateProject(value),
  });

  const fieldComment = useField({
    initialValue: task.comment,
  });

  const updateEntry = async () => {
    // Validate all fields
    const dateError = await fieldDate.validate();
    const startError = await fieldStart.validate();
    const endError = await fieldEnd.validate();
    const projectError = await fieldProject.validate();
    const commentError = await fieldComment.validate();

    if (dateError || startError || endError || projectError || commentError) {
      notifications.show({
        message: "Please fix validation errors before updating the task.",
        color: "red",
      });
      return;
    }

    if (
      fieldProject.getValue() &&
      !projects.includes(fieldProject.getValue())
    ) {
      setProjects((prevProjects) => [...prevProjects, fieldProject.getValue()]);
    }

    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              date: dateValue || dayjs().format("YYYY-MM-DD"),
              timeStart: fieldStart.getValue(),
              timeEnd: fieldEnd.getValue() || "",
              project: fieldProject.getValue(),
              comment: fieldComment.getValue() || "",
            }
          : t,
      ),
    );

    notifications.show({ message: "Task updated successfully!" });
  };

  const stopTask = () => {
    const endTime = dayjs().format("HH:mm");
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === props.taskId ? { ...t, timeEnd: endTime } : t,
      ),
    );
    fieldEnd.setValue(endTime);
  };

  // FIXME only enable the edit button if values have changed

  return (
    <Table.Tr key={task.id}>
      <Table.Td>
        <DateField {...fieldDate.getInputProps()} />
      </Table.Td>
      <Table.Td>
        <TimeInput size="xs" {...fieldStart.getInputProps()} />
      </Table.Td>
      <Table.Td>
        <TimeInput size="xs" {...fieldEnd.getInputProps()} />
      </Table.Td>
      <Table.Td>
        <Autocomplete
          {...fieldProject.getInputProps()}
          data={projects}
          size="xs"
        />
      </Table.Td>
      <Table.Td>
        <TextInput
          {...fieldComment.getInputProps()}
          placeholder="Enter a comment"
          size="xs"
        />
      </Table.Td>
      <Table.Td>
        <ActionIcon
          variant="default"
          size="md"
          aria-label="Update Task"
          mt={1}
          onClick={updateEntry}
        >
          <IconPencilCheck />
        </ActionIcon>{" "}
        {canStopTask && (
          <ActionIcon
            variant="light"
            size="md"
            aria-label="Stop Task"
            onClick={stopTask}
          >
            <IconClockPause />
          </ActionIcon>
        )}
      </Table.Td>
    </Table.Tr>
  );
}
