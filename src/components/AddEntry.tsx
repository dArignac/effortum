import { Autocomplete, Button, Table, TextInput } from "@mantine/core";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import dayjs from "dayjs";
import { useState } from "react";
import { useProjectsContext } from "../contexts/ProjectsContext";
import { useTasksContext } from "../contexts/TasksContext";

interface FormValues {
  date: string;
  start: string;
  end: string;
  project: string;
  comment?: string;
}

export function AddEntry() {
  const { tasks, setTasks } = useTasksContext();
  const { projects, setProjects } = useProjectsContext();
  const [dateValue, setDateValue] = useState<string | null>(null);

  const form = useForm<FormValues>({
    initialValues: {
      date: "",
      start: "",
      end: "",
      project: "",
      comment: "",
    },
    validate: {
      date: () => (dateValue ? null : "Date is required"),
      start: (value) => (value ? null : "Start time is required"),
      end: (value, values) => {
        if (value) {
          return dayjs(`${dayjs().format("YYYY-MM-DD")} ${value}`).isBefore(
            dayjs(`${dayjs().format("YYYY-MM-DD")} ${values.start}`),
          )
            ? "End time must be after start time"
            : null;
        }
        return null;
      },
      project: (value) => (value ? null : "Project is required"),
    },
  });

  const addEntry = (values: FormValues) => {
    if (values.project && !projects.includes(values.project)) {
      setProjects((prevProjects) => [...prevProjects, values.project]);
    }

    setTasks((prevTasks) => [
      ...prevTasks,
      {
        id: crypto.randomUUID(),
        date: dateValue || dayjs().format("YYYY-MM-DD"),
        timeStart: values.start,
        timeEnd: values.end || "",
        project: values.project,
        comment: values.comment || "",
      },
    ]);

    form.reset();
  };

  // FIXME handle in TaskListRow
  const cannotAddEntry = tasks.some(
    (task) => !task.timeEnd || task.timeEnd.length === 0,
  );
  if (cannotAddEntry) return null;

  return (
    <form onSubmit={form.onSubmit((values) => addEntry(values))}>
      <Table>
        <Table.Tbody>
          <Table.Tr bd={"0px"}>
            <Table.Td>
              <DatePickerInput
                {...form.getInputProps("date")}
                defaultDate={dayjs().format("YYYY-MM-DD")}
                label="Date"
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
                w={120}
              />
            </Table.Td>
            <Table.Td>
              <TimeInput {...form.getInputProps("start")} label="Start" />
            </Table.Td>
            <Table.Td>
              <TimeInput {...form.getInputProps("end")} label="End" />
            </Table.Td>
            <Table.Td>
              <Autocomplete
                {...form.getInputProps("project")}
                label="Project"
                data={projects}
              />
            </Table.Td>
            <Table.Td>
              <TextInput
                {...form.getInputProps("comment")}
                label="Comment"
                placeholder="Enter a comment"
              />
            </Table.Td>
            <Table.Td>
              <Button variant="filled" type="submit" mt={20}>
                Add
              </Button>
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </form>
  );
}
