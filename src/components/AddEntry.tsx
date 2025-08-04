import { Autocomplete, Button, Table, TextInput } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { useField } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { useState } from "react";
import {
  validateDate,
  validateEnd,
  validateProject,
  validateStart,
} from "../validations";
import { DateSelectionField } from "./DateField";
import { useStore } from "../store";

export function AddEntryRow() {
  const projects = useStore((state) => state.projects);
  const addTask = useStore((state) => state.addTask);
  const addProject = useStore((state) => state.addProject);

  const [dateValue, setDateValue] = useState<string | null>(null);
  const [startValue, setStartValue] = useState<string>("");
  const [endValue, setEndValue] = useState<string>("");
  const [projectValue, setProjectValue] = useState<string>("");
  const [commentValue, setCommentValue] = useState<string>("");

  const fieldDate = useField({
    initialValue: dayjs().format("YYYY-MM-DD"),
    validate: validateDate,
    onValueChange: (value) => setDateValue(value),
  });

  const fieldStart = useField({
    initialValue: "",
    validate: validateStart,
    onValueChange: (value) => setStartValue(value),
  });

  const fieldEnd = useField({
    initialValue: "",
    validate: (value) => validateEnd(value, fieldStart.getValue()),
    onValueChange: (value) => setEndValue(value),
  });

  const fieldProject = useField({
    initialValue: "",
    validate: (value) => validateProject(value),
    onValueChange: (value) => setProjectValue(value),
  });

  const fieldComment = useField({
    initialValue: "",
    onValueChange: (value) => setCommentValue(value),
  });

  const addEntry = async () => {
    // Validate all fields
    const dateError = await fieldDate.validate();
    const startError = await fieldStart.validate();
    const endError = await fieldEnd.validate();
    const projectError = await fieldProject.validate();
    const commentError = await fieldComment.validate();

    if (dateError || startError || endError || projectError || commentError) {
      notifications.show({
        message: "Please fix validation errors before adding the task.",
        color: "red",
      });
      return;
    }

    if (
      fieldProject.getValue() &&
      !projects.includes(fieldProject.getValue())
    ) {
      addProject(fieldProject.getValue());
    }

    addTask({
      id: crypto.randomUUID(),
      date: dateValue || dayjs().format("YYYY-MM-DD"),
      timeStart: startValue,
      timeEnd: endValue || "",
      project: projectValue,
      comment: commentValue || "",
    });
  };

  return (
    <Table.Tr>
      <Table.Td>
        <DateSelectionField {...fieldDate.getInputProps()} />
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
      <Table.Td></Table.Td>
      <Table.Td>
        <Button variant="filled" size="xs" onClick={addEntry}>
          Add
        </Button>
      </Table.Td>
    </Table.Tr>
  );
}
