import { Autocomplete, Button, Table } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { useField } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useEffortumStore } from "../store";
import { isRunningTask, roundTimeToNearest5Minutes } from "../utils/time";
import {
  validateDate,
  validateEnd,
  validateProject,
  validateStart,
} from "../validations";
import { DateSelectionField } from "./DateField";

export function AddEntryRow() {
  const projects = useEffortumStore((state) => state.projects);
  const tasks = useEffortumStore((state) => state.tasks);
  const addTask = useEffortumStore((state) => state.addTask);
  const getUniqueTaskCommentsForProject = useEffortumStore(
    (state) => state.getUniqueTaskCommentsForProject,
  );
  const endTimeOfLastStoppedTask = useEffortumStore(
    (state) => state.endTimeOfLastStoppedTask,
  );
  const setEndTimeOfLastStoppedTask = useEffortumStore(
    (state) => state.setEndTimeOfLastStoppedTask,
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
  const lastPrefilledTimeRef = useRef<string | null>(null);

  const runningTask = useMemo(() => tasks.find(isRunningTask), [tasks]);
  const runningTaskRef = useRef(runningTask);

  useEffect(() => {
    if (endTimeOfLastStoppedTask != null) {
      if (
        (startValue.length === 0 ||
          startValue === lastPrefilledTimeRef.current) &&
        fieldStart.getValue() !== endTimeOfLastStoppedTask
      ) {
        fieldStart.setValue(endTimeOfLastStoppedTask);
        lastPrefilledTimeRef.current = endTimeOfLastStoppedTask;
      }
    }
  }, [startValue, endTimeOfLastStoppedTask]);

  useEffect(() => {
    let isCancelled = false;

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
        const comments = await getUniqueTaskCommentsForProject(project.id);
        if (!isCancelled) {
          setAvailableComments(comments);
        }
      } catch (error) {
        console.error("Failed to load comments:", error);
        if (!isCancelled) {
          setAvailableComments([]);
        }
      } finally {
        if (!isCancelled) {
          setIsCommentLoading(false);
        }
      }
    };

    loadComments();

    return () => {
      isCancelled = true;
    };
  }, [projectValue, projects, tasks, getUniqueTaskCommentsForProject]);

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
    validate: (value) => {
      if (runningTaskRef.current && (!value || value.trim().length === 0)) {
        return "End time is required while another task is running";
      }
      return validateEnd(value, fieldStart.getValue());
    },
    onValueChange: (value) => setEndValue(value),
  });

  useEffect(() => {
    runningTaskRef.current = runningTask;
    if (
      !runningTask &&
      fieldEnd.error === "End time is required while another task is running"
    ) {
      fieldEnd.setError(null);
    }
  }, [runningTask, fieldEnd]);

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

    if (runningTask && !selectedEnd.trim()) {
      notifications.show({
        title: "Active task already running",
        message: `An active task is already running on ${runningTask.date} (${runningTask.project || "No project"}). Only one active task is allowed. Please stop that task first or set an end time.`,
        color: "red",
      });
      return;
    }

    try {
      await addTask({
        id: crypto.randomUUID(),
        date: selectedDate,
        timeStart: roundedStartValue,
        timeEnd: roundedEndValue,
        projectName: selectedProject,
        comment: selectedComment || "",
      });

      setEndTimeOfLastStoppedTask(null);
      lastPrefilledTimeRef.current = null;
    } catch (error) {
      notifications.show({
        title: "Failed to add task",
        message:
          error instanceof Error
            ? error.message
            : "Failed to add task. Please try again.",
        color: "red",
      });
    }
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
          placeholder={runningTask ? "End (required)" : undefined}
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
