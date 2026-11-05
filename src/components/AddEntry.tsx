import { Autocomplete, Button, Table } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { useField } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef } from "react";
import { useEffortumStore } from "../store";
import { applyTimeRounding, isRunningTask } from "../utils/time";
import {
  validateDate,
  validateEnd,
  validateProject,
  validateStart,
} from "../validations";
import { DateSelectionField } from "./DateField";
import { useProjectComments } from "./useProjectComments";

export function AddEntryRow(props: { projectNames?: string[] }) {
  const projects = useEffortumStore((state) => state.projects);
  const tasks = useEffortumStore((state) => state.tasks);
  const addTask = useEffortumStore((state) => state.addTask);
  const endTimeOfLastStoppedTask = useEffortumStore(
    (state) => state.endTimeOfLastStoppedTask,
  );
  const setEndTimeOfLastStoppedTask = useEffortumStore(
    (state) => state.setEndTimeOfLastStoppedTask,
  );
  const roundToNearest5Minutes = useEffortumStore(
    (state) => state.settings.at(0)?.roundToNearest5Minutes ?? false,
  );

  const lastPrefilledTimeRef = useRef<string | null>(null);
  const runningTask = useMemo(() => tasks.find(isRunningTask), [tasks]);
  const runningTaskRef = useRef(runningTask);

  const fieldDate = useField({
    initialValue: dayjs().format("YYYY-MM-DD"),
    validate: validateDate,
  });

  const fieldStart = useField({
    initialValue: "",
    validate: validateStart,
  });

  const fieldEnd = useField({
    initialValue: "",
    validate: (value) => {
      if (runningTaskRef.current && (!value || value.trim().length === 0)) {
        return "End time is required while another task is running";
      }
      return validateEnd(value, fieldStart.getValue());
    },
  });

  const fieldProject = useField({
    initialValue: "",
    validate: validateProject,
  });

  const fieldComment = useField({
    initialValue: "",
  });

  const startValue = fieldStart.getValue();
  const { availableComments, isCommentLoading } = useProjectComments(
    fieldProject.getValue(),
  );

  useEffect(() => {
    if (
      endTimeOfLastStoppedTask != null &&
      (startValue.length === 0 ||
        startValue === lastPrefilledTimeRef.current) &&
      startValue !== endTimeOfLastStoppedTask
    ) {
      fieldStart.setValue(endTimeOfLastStoppedTask);
      lastPrefilledTimeRef.current = endTimeOfLastStoppedTask;
    }
  }, [startValue, endTimeOfLastStoppedTask]);

  useEffect(() => {
    runningTaskRef.current = runningTask;
    if (
      !runningTask &&
      fieldEnd.error === "End time is required while another task is running"
    ) {
      fieldEnd.setError(null);
    }
  }, [runningTask, fieldEnd]);

  const addEntry = async () => {
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

    const roundedStartValue = applyTimeRounding(
      selectedStart,
      roundToNearest5Minutes,
    );
    const roundedEndValue = applyTimeRounding(
      selectedEnd,
      roundToNearest5Minutes,
    );

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

      fieldStart.reset();
      fieldEnd.reset();
      fieldProject.reset();
      fieldComment.reset();
      lastPrefilledTimeRef.current = null;
      setEndTimeOfLastStoppedTask(
        !runningTask && roundedEndValue ? roundedEndValue : null,
      );
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
          data={props.projectNames ?? projects.map((p) => p.name)}
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
