import { Autocomplete, Button, Table } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { useField } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useEffortumStore } from "../store";
import { LazyDataLoader } from "../services/lazyDataLoader";
import { roundTimeToNearest5Minutes } from "../utils/time";
import {
  validateDate,
  validateEnd,
  validateProject,
  validateStart,
} from "../validations";
import { DateSelectionField } from "./DateField";

export function AddEntryRow() {
  const projects = useEffortumStore((state) => state.projects);
  const addTask = useEffortumStore((state) => state.addTask);
  const endTimeOfLastStoppedTask = useEffortumStore(
    (state) => state.endTimeOfLastStoppedTask,
  );
  const roundToNearest5Minutes = useEffortumStore(
    (state) => state.settings.at(0)?.roundToNearest5Minutes ?? false,
  );

  const [, setDateValue] = useState<string | null>(null);
  const [startValue, setStartValue] = useState<string>("");
  const [, setEndValue] = useState<string>("");
  const [projectValue, setProjectValue] = useState<string>("");
  const [, setCommentValue] = useState<string>("");
  const [availableComments, setAvailableComments] = useState<string[]>([]);
  const [isCommentLoading, setIsCommentLoading] = useState(false);

  useEffect(() => {
    if (endTimeOfLastStoppedTask != null && startValue.length === 0) {
      fieldStart.setValue(endTimeOfLastStoppedTask);
    }
  }, [startValue, endTimeOfLastStoppedTask]);

  useEffect(() => {
    const loadComments = async () => {
      // only fill comments if a project is selected
      if (projectValue.length === 0) {
        setAvailableComments([]);
        return;
      }

      setIsCommentLoading(true);
      try {
        // Find the project by name to get its ID
        const project = projects.find((p) => p.name === projectValue);
        if (!project) {
          setAvailableComments([]);
          return;
        }

        // Load comments for this specific project on-demand
        const comments = await LazyDataLoader.loadCommentsForProject(project.id);
        setAvailableComments(comments);
      } catch (error) {
        console.error("Failed to load comments:", error);
        setAvailableComments([]);
      } finally {
        setIsCommentLoading(false);
      }
    };

    loadComments();
  }, [projectValue, projects]);

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

    const selectedDate = fieldDate.getValue() || dayjs().format("YYYY-MM-DD");
    const selectedStart = fieldStart.getValue();
    const selectedEnd = fieldEnd.getValue();
    const selectedProject = fieldProject.getValue().trim();
    if (!selectedProject) {
      notifications.show({ message: "Project is required", color: "red" });
      return;
    }
    const selectedComment = fieldComment.getValue();

    const roundedStartValue = roundToNearest5Minutes
      ? roundTimeToNearest5Minutes(selectedStart)
      : selectedStart;
    const roundedEndValue = selectedEnd
      ? roundToNearest5Minutes
        ? roundTimeToNearest5Minutes(selectedEnd)
        : selectedEnd
      : "";

    await addTask({
      id: crypto.randomUUID(),
      date: selectedDate,
      timeStart: roundedStartValue,
      timeEnd: roundedEndValue,
      projectName: selectedProject,
      comment: selectedComment || "",
    });
  };

  return (
    <Table.Tr>
      <Table.Td>
        <DateSelectionField
          {...fieldDate.getInputProps()}
          dataTestId="add-entry-input-date"
        />
      </Table.Td>
      <Table.Td>
        <TimeInput
          size="xs"
          {...fieldStart.getInputProps()}
          data-testid="add-entry-input-start-time"
        />
      </Table.Td>
      <Table.Td>
        <TimeInput
          size="xs"
          {...fieldEnd.getInputProps()}
          data-testid="add-entry-input-end-time"
        />
      </Table.Td>
      <Table.Td>
        <Autocomplete
          {...fieldProject.getInputProps()}
          data={projects.map((p) => p.name)}
          size="xs"
          data-testid="add-entry-input-project"
          placeholder="Select or enter a project"
        />
      </Table.Td>
      <Table.Td>
        <Autocomplete
          {...fieldComment.getInputProps()}
          data={availableComments}
          size="xs"
          data-testid="add-entry-input-comment"
          placeholder="Select or enter a comment"
          loading={isCommentLoading}
        />
      </Table.Td>
      <Table.Td></Table.Td>
      <Table.Td>
        <Button
          variant="filled"
          size="xs"
          onClick={addEntry}
          data-testid="button-add-task"
        >
          Add
        </Button>
      </Table.Td>
    </Table.Tr>
  );
}
