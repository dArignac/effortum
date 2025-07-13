import { Table, TextInput } from "@mantine/core";
import { useField } from "@mantine/form";
import { useTasksContext } from "../contexts/TasksContext";

export function AddEntry() {
  const { tasks, setTasks } = useTasksContext();

  const fieldComment = useField({
    initialValue: "",
  });

  const addEntry = () => {
    setTasks((prevTasks) => [
      ...prevTasks,
      {
        id: crypto.randomUUID(),
        date: "2023-10-01",
        timeStart: "08:00",
        timeEnd: "09:00",
        project: "New Project",
        comment: fieldComment.getValue(),
      },
    ]);
  };

  return (
    <Table.Tr>
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
        <input type="text" placeholder="Project Name" />
      </Table.Td>
      <Table.Td>
        <TextInput
          {...fieldComment.getInputProps()}
          label="Comment"
          placeholder="Enter a comment"
        />
      </Table.Td>
      <Table.Td>
        <button onClick={addEntry}>Add</button>
      </Table.Td>
    </Table.Tr>
  );
}
