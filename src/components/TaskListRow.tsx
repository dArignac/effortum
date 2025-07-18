import { ActionIcon, Autocomplete, Table, TextInput } from "@mantine/core";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import { useField } from "@mantine/form";
import { IconPencilCheck } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useProjectsContext } from "../contexts/ProjectsContext";
import { useTasksContext } from "../contexts/TasksContext";
import { StopEntry } from "./StopEntry";

export function TaskListRow(props: { taskId: string }) {
  const { tasks, setTasks } = useTasksContext();
  const { projects, setProjects } = useProjectsContext();
  const [dateValue, setDateValue] = useState<string | null>(null);

  const task = tasks.find((task) => task.id === props.taskId);
  if (!task) {
    return null;
  }

  useEffect(() => {
    setDateValue(task.date);
  }, [task.date]);

  // FYI cant use form due to table
  const fieldDate = useField({
    initialValue: task.date,
    validate: (value) => (value ? null : "Date is required"),
  });

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

  const fieldProject = useField({
    initialValue: task.project,
    validate: (value) => (value ? null : "Project is required"),
  });

  const fieldComment = useField({
    initialValue: task.comment,
    validate: (value) => (value ? null : "Comment is required"),
  });

  const updateEntry = () => {
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

    // FIXME some snackbar would be nice
  };

  return (
    <Table.Tr key={task.id}>
      <Table.Td>
        <DatePickerInput
          {...fieldDate.getInputProps()}
          defaultDate={dayjs().format("YYYY-MM-DD")}
          placeholder="Pick date"
          value={dateValue}
          onChange={setDateValue}
          valueFormat="YYYY-MM-DD"
          presets={[
            {
              value: dayjs().subtract(1, "day").format("YYYY-MM-DD"),
              label: "Yesterday",
            },
            { value: dayjs().format("YYYY-MM-DD"), label: "Today" },
            {
              value: dayjs().add(1, "day").format("YYYY-MM-DD"),
              label: "Tomorrow",
            },
          ]}
          size="xs"
          w={120}
        />
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
        {/* FIXME maybe move the stop entry code here as well, also it does not re-render currently */}
        <StopEntry taskId={task.id} />
      </Table.Td>
    </Table.Tr>
  );
}
