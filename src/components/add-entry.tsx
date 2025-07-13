import { Autocomplete, Table, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useProjectsContext } from "../contexts/ProjectsContext";
import { useTasksContext } from "../contexts/TasksContext";

interface FormValues {
  project: string;
  comment?: string;
}

export function AddEntry() {
  const { setTasks } = useTasksContext();
  const { projects, setProjects } = useProjectsContext();

  const form = useForm<FormValues>({
    initialValues: {
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
        date: "2023-10-01",
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
              <input type="date" />
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
              <button type="submit">Add</button>
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </form>
  );
}
