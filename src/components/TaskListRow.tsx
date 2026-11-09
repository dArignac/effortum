import { ActionIcon, Autocomplete, Group, Table } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { useField } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconClockPause,
  IconPencilCheck,
  IconPlayerPlay,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Task } from "../models/Task";
import { useEffortumStore } from "../store";
import {
  applyTimeRounding,
  getDurationAsTime,
  isRunningTask,
} from "../utils/time";
import {
  validateDate,
  validateEnd,
  validateProject,
  validateStart,
} from "../validations";
import { DateSelectionField } from "./DateField";
import { useProjectComments } from "./useProjectComments";

export function TaskListRow(props: {
  taskId: string | null;
  projectNames?: string[];
}) {
  const tasks = useEffortumStore((state) => state.tasks);
  const task = tasks.find((t) => t.id === props.taskId);
  if (!task) {
    return null;
  }

  return <TaskListRowContent task={task} projectNames={props.projectNames} />;
}

function TaskListRowContent(props: { task: Task; projectNames?: string[] }) {
  const { task } = props;
  const tasks = useEffortumStore((state) => state.tasks);
  const addTask = useEffortumStore((state) => state.addTask);
  const updateTask = useEffortumStore((state) => state.updateTask);
  const projects = useEffortumStore((state) => state.projects);
  const setEndTimeOfLastStoppedTask = useEffortumStore(
    (state) => state.setEndTimeOfLastStoppedTask,
  );
  const endTimeOfLastStoppedTask = useEffortumStore(
    (state) => state.endTimeOfLastStoppedTask,
  );
  const roundToNearest5Minutes = useEffortumStore(
    (state) => state.settings.at(0)?.roundToNearest5Minutes ?? false,
  );

  const [hasChanges, setHasChanges] = useState(false);

  const canStopTask = isRunningTask(task);
  const hasRunningTask = useMemo(() => tasks.some(isRunningTask), [tasks]);

  const currentProjectName =
    projects.find((project) => project.id === task.projectId)?.name ||
    task.project ||
    "";

  // FYI cant use form due to table
  const fieldDate = useField({
    initialValue: task.date,
    validate: validateDate,
    onValueChange: (value) => {
      setHasChanges(value !== task.date);
    },
  });

  const fieldStart = useField({
    initialValue: task.timeStart,
    validate: validateStart,
    onValueChange: (value) => {
      setHasChanges(value !== task.timeStart);
    },
  });

  const fieldEnd = useField({
    initialValue: task.timeEnd || "",
    validate: (value) => validateEnd(value, fieldStart.getValue()),
    onValueChange: (value) => {
      setHasChanges(value !== task.timeEnd);
    },
  });

  const fieldProject = useField({
    initialValue: currentProjectName,
    validate: validateProject,
    onValueChange: (value) => {
      setHasChanges(value.trim() !== currentProjectName);
    },
  });

  const fieldComment = useField({
    initialValue: task.comment,
    onValueChange: (value) => {
      setHasChanges(value !== task.comment);
    },
  });

  const { availableComments } = useProjectComments(fieldProject.getValue());

  /**
   * Validates and persists row edits for the current task.
   */
  const updateEntry = async () => {
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

    const startTime = applyTimeRounding(
      fieldStart.getValue(),
      roundToNearest5Minutes,
    );
    const endTime = applyTimeRounding(
      fieldEnd.getValue(),
      roundToNearest5Minutes,
    );

    try {
      if (
        (canStopTask && endTime) ||
        (endTimeOfLastStoppedTask &&
          task.timeEnd === endTimeOfLastStoppedTask &&
          endTime)
      ) {
        setEndTimeOfLastStoppedTask(endTime);
      }

      await updateTask(task.id, {
        date: fieldDate.getValue() || dayjs().format("YYYY-MM-DD"),
        timeStart: startTime,
        timeEnd: endTime,
        projectName: fieldProject.getValue(),
        comment: fieldComment.getValue() || "",
      });

      fieldStart.setValue(startTime);
      fieldEnd.setValue(endTime);

      notifications.show({ message: "Task updated successfully!" });
      setHasChanges(false);
    } catch {
      notifications.show({
        message: "Failed to update task. Please try again.",
        color: "red",
      });
    }
  };

  /**
   * Stops an in-progress task by setting its end time to now.
   */
  const stopTask = async () => {
    const endTime = applyTimeRounding(
      dayjs().format("HH:mm"),
      roundToNearest5Minutes,
    );

    try {
      // Store the end time to be able to set it as new start time before updateTask
      setEndTimeOfLastStoppedTask(endTime);

      await updateTask(task.id, {
        timeEnd: endTime,
        projectName: fieldProject.getValue(),
        comment: fieldComment.getValue() || "",
      });

      fieldEnd.setValue(endTime);
      setHasChanges(false);
    } catch {
      notifications.show({
        message: "Failed to stop task. Please try again.",
        color: "red",
      });
    }
  };

  /**
   * Starts a new running task with this task's project and comment at the current time.
   */
  const restartTask = async () => {
    const startTime = applyTimeRounding(
      dayjs().format("HH:mm"),
      roundToNearest5Minutes,
    );
    const today = dayjs().format("YYYY-MM-DD");
    const projectToUse = fieldProject.getValue().trim() || currentProjectName;
    const commentToUse = fieldComment.getValue() || task.comment || "";

    try {
      setEndTimeOfLastStoppedTask(null);
      await addTask({
        id: crypto.randomUUID(),
        date: today,
        timeStart: startTime,
        timeEnd: "",
        projectId: task.projectId,
        projectName: projectToUse,
        comment: commentToUse,
      });

      notifications.show({ message: "Task started successfully!" });
    } catch {
      notifications.show({
        message: "Failed to start task. Please try again.",
        color: "red",
      });
    }
  };

  return (
    <Table.Tr data-testid={`task-row-${task.id}`}>
      <Table.Td>
        <DateSelectionField
          dataTestId={`date-selection-${task.date}`}
          {...fieldDate.getInputProps()}
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
          data={props.projectNames ?? projects.map((p) => p.name)}
          size="xs"
          placeholder="Select or enter a project"
        />
      </Table.Td>
      <Table.Td>
        <Autocomplete
          {...fieldComment.getInputProps()}
          data={availableComments}
          size="xs"
          placeholder="Select or enter a comment"
        />
      </Table.Td>
      <Table.Td>
        {getDurationAsTime(fieldStart.getValue(), fieldEnd.getValue())}
      </Table.Td>
      <Table.Td>
        <Group gap={4} wrap="nowrap">
          <ActionIcon
            variant="default"
            size="md"
            aria-label="Update Task"
            mt={1}
            onClick={updateEntry}
            disabled={!hasChanges}
            data-testid={`button-update-task-${task.id}`}
          >
            <IconPencilCheck />
          </ActionIcon>
          {canStopTask && (
            <ActionIcon
              variant="light"
              size="md"
              aria-label="Stop Task"
              onClick={stopTask}
              data-testid={`button-stop-task-${task.id}`}
            >
              <IconClockPause />
            </ActionIcon>
          )}
          {!hasRunningTask && (
            <ActionIcon
              variant="subtle"
              size="md"
              aria-label="Restart Task"
              onClick={restartTask}
              data-testid={`button-restart-task-${task.id}`}
            >
              <IconPlayerPlay />
            </ActionIcon>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
