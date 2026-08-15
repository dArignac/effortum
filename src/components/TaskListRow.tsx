import { ActionIcon, Autocomplete, Table } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { useField } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconClockPause, IconPencilCheck } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Comment } from "../models/Comment";
import { useEffortumStore } from "../store";
import { getDurationAsTime, roundTimeToNearest5Minutes } from "../utils/time";
import {
  validateDate,
  validateEnd,
  validateProject,
  validateStart,
} from "../validations";
import { DateSelectionField } from "./DateField";

export function TaskListRow(props: { taskId: string | null }) {
  const tasks = useEffortumStore((state) => state.tasks);
  const updateTask = useEffortumStore((state) => state.updateTask);
  const getCommentsForProject = useEffortumStore(
    (state) => state.getCommentsForProject,
  );
  const projects = useEffortumStore((state) => state.projects);
  const setEndTimeOfLastStoppedTask = useEffortumStore(
    (state) => state.setEndTimeOfLastStoppedTask,
  );
  const roundToNearest5Minutes = useEffortumStore(
    (state) => state.settings.at(0)?.roundToNearest5Minutes ?? false,
  );

  const [hasChanges, setHasChanges] = useState(false);
  const [dateValue, setDateValue] = useState<string | null>(null);
  const [canStopTask, setCanStopTask] = useState(false);
  const [availableComments, setAvailableComments] = useState<Comment[]>([]);

  const task = tasks.find((task) => task.id === props.taskId);
  if (!task) {
    return null;
  }

  useEffect(() => {
    setDateValue(task.date);
  }, [task.date]);

  useEffect(() => {
    setCanStopTask(!task.timeEnd || task.timeEnd.length === 0);
  }, [task.timeEnd]);

  // FYI cant use form due to table
  const fieldDate = useField({
    initialValue: task.date,
    validate: validateDate,
    onValueChange: (value) => {
      setDateValue(value);
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
    initialValue: task.project,
    validate: (value) => validateProject(value),
    onValueChange: (value) => {
      setHasChanges(value !== task.project);
    },
  });

  const fieldComment = useField({
    initialValue: task.comment,
    onValueChange: (value) => {
      setHasChanges(value !== task.comment);
    },
  });

  useEffect(() => {
    const loadComments = async () => {
      // only fill comments if a project is selected
      if (fieldProject.getValue().length > 0) {
        const comments = await getCommentsForProject(fieldProject.getValue());
        setAvailableComments(comments);
      }
    };
    loadComments();
  }, [fieldProject.getValue()]);

  const updateEntry = async () => {
    // Validate all fields
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

    const startTime = roundToNearest5Minutes
      ? roundTimeToNearest5Minutes(fieldStart.getValue())
      : fieldStart.getValue();
    const endTime = fieldEnd.getValue()
      ? roundToNearest5Minutes
        ? roundTimeToNearest5Minutes(fieldEnd.getValue())
        : fieldEnd.getValue()
      : "";

    updateTask(task.id, {
      date: dateValue || dayjs().format("YYYY-MM-DD"),
      timeStart: startTime,
      timeEnd: endTime,
      project: fieldProject.getValue(),
      comment: fieldComment.getValue() || "",
    });

    fieldStart.setValue(startTime);
    fieldEnd.setValue(endTime);

    notifications.show({ message: "Task updated successfully!" });

    setHasChanges(false);
  };

  const stopTask = () => {
    const nowAsTime = dayjs().format("HH:mm");
    const endTime = roundToNearest5Minutes
      ? roundTimeToNearest5Minutes(nowAsTime)
      : nowAsTime;

    updateTask(task.id, {
      timeEnd: endTime,
      project: fieldProject.getValue(),
      comment: fieldComment.getValue() || "",
    });
    fieldEnd.setValue(endTime);
    setHasChanges(false);

    // store the end time to be able to set it as new start time
    setEndTimeOfLastStoppedTask(endTime);
  };

  return (
    <Table.Tr key={task.id} data-testid={`task-row-${task.id}`}>
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
          data={projects.map((p) => p.name)}
          size="xs"
          placeholder="Select or enter a project"
        />
      </Table.Td>
      <Table.Td>
        <Autocomplete
          {...fieldComment.getInputProps()}
          data={availableComments?.map((c: Comment) => c.comment) || []}
          size="xs"
          placeholder="Select or enter a comment"
        />
      </Table.Td>
      <Table.Td>
        {getDurationAsTime(fieldStart.getValue(), fieldEnd.getValue())}
      </Table.Td>
      <Table.Td>
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
        </ActionIcon>{" "}
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
      </Table.Td>
    </Table.Tr>
  );
}
