import { Autocomplete, Button, Table, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useProjectsContext } from "../contexts/ProjectsContext";
import { useTasksContext } from "../contexts/TasksContext";
import { useState } from "react";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";

interface FormValues {
  date: string;
  project: string;
  comment?: string;
}

export function AddEntry() {
  const { setTasks } = useTasksContext();
  const { projects, setProjects } = useProjectsContext();

  const [dateValue, setDateValue] = useState<string | null>(null);

  const form = useForm<FormValues>({
    initialValues: {
      date: dayjs().format("YYYY-MM-DD"),
      project: "",
      comment: "",
    },
    validate: {
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
        timeStart: "08:00",
        timeEnd: "09:00",
        project: values.project,
        comment: values.comment || "",
      },
    ]);

    form.reset();
  };

  return (
    <form onSubmit={form.onSubmit((values) => addEntry(values))}>
      <Table>
        <Table.Tbody>
          <Table.Tr bd={"0px"}>
            <Table.Td>
              <DatePickerInput
                {...form.getInputProps("date")}
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
              />
            </Table.Td>
            <Table.Td>
              <input type="time" />
            </Table.Td>
            <Table.Td>
              <input type="time" />
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
