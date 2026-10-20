import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Space,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertTriangle,
  IconCalendar,
  IconClockPause,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useMemo } from "react";
import { Task } from "../models/Task";
import { useEffortumStore } from "../store";
import { filterTasksByDateRange } from "../utils/filters";
import { isRunningTask, roundTimeToNearest5Minutes } from "../utils/time";
import { AddEntryRow } from "./AddEntry";
import { LoadingIndicator } from "./LoadingIndicator";
import { TaskListRow } from "./TaskListRow";

function compareTasksByTimeStart(a: Task, b: Task) {
  const dateTimeA = dayjs(`${a.date} ${a.timeStart}`, "YYYY-MM-DD HH:mm");
  const dateTimeB = dayjs(`${b.date} ${b.timeStart}`, "YYYY-MM-DD HH:mm");
  return dateTimeA.valueOf() - dateTimeB.valueOf();
}

export function TaskList() {
  const tasks = useEffortumStore((state) => state.tasks);
  const selectedDateRange = useEffortumStore(
    (state) => state.selectedDateRange,
  );
  const setSelectedDateRange = useEffortumStore(
    (state) => state.setSelectedDateRange,
  );
  const isDataLoading = useEffortumStore((state) => state.isDataLoading);
  const updateTask = useEffortumStore((state) => state.updateTask);
  const setEndTimeOfLastStoppedTask = useEffortumStore(
    (state) => state.setEndTimeOfLastStoppedTask,
  );
  const roundToNearest5Minutes = useEffortumStore(
    (state) => state.settings.at(0)?.roundToNearest5Minutes ?? false,
  );

  const runningTask = useMemo(() => tasks.find(isRunningTask), [tasks]);
  const isRunningOutsideDateRange = useMemo(() => {
    if (!runningTask) return false;
    return !filterTasksByDateRange(selectedDateRange)(runningTask);
  }, [runningTask, selectedDateRange]);

  const handleStopRunningTask = async (taskToStop: Task) => {
    const nowAsTime = dayjs().format("HH:mm");
    const endTime = roundToNearest5Minutes
      ? roundTimeToNearest5Minutes(nowAsTime)
      : nowAsTime;

    try {
      setEndTimeOfLastStoppedTask(endTime);
      await updateTask(taskToStop.id, {
        timeEnd: endTime,
      });
      notifications.show({
        message: "Active task stopped successfully!",
        color: "green",
      });
    } catch {
      notifications.show({
        message: "Failed to stop active task. Please try again.",
        color: "red",
      });
    }
  };

  const handleGoToRunningTaskDate = (taskDate: string) => {
    setSelectedDateRange([taskDate, taskDate]);
  };

  const sortedTasks = useMemo(() => {
    return [...tasks]
      .filter(filterTasksByDateRange(selectedDateRange))
      .sort(compareTasksByTimeStart);
  }, [tasks, selectedDateRange]);

  const canAddTask = useMemo(() => {
    return !sortedTasks.some(
      (task) => !task.timeEnd || task.timeEnd.length === 0,
    );
  }, [sortedTasks]);

  // Show loading indicator when data is being fetched
  if (isDataLoading) {
    return (
      <Table stickyHeader stickyHeaderOffset={0} data-testid="task-list-table">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={125}>Date</Table.Th>
            <Table.Th w={80}>Start</Table.Th>
            <Table.Th w={80}>End</Table.Th>
            <Table.Th>Project</Table.Th>
            <Table.Th>Comment</Table.Th>
            <Table.Th w={50}>Duration</Table.Th>
            <Table.Th w={90}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td colSpan={7}>
              <LoadingIndicator />
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    );
  }

  return (
    <>
      {isRunningOutsideDateRange && runningTask && (
        <Alert
          variant="light"
          color="orange"
          title="Active Task Running"
          icon={<IconAlertTriangle size={18} />}
          mb="md"
          data-testid="active-task-alert"
        >
          <Stack gap="xs">
            <Text size="sm">
              An active task is currently running on{" "}
              <strong>{runningTask.date}</strong> (Project:{" "}
              <strong>{runningTask.project}</strong>
              {runningTask.comment ? ` - "${runningTask.comment}"` : ""},
              started at <strong>{runningTask.timeStart}</strong>). Only one
              active task is allowed. Please stop that task first.
            </Text>
            <Group gap="xs">
              <Button
                size="xs"
                variant="filled"
                color="orange"
                leftSection={<IconClockPause size={14} />}
                onClick={() => handleStopRunningTask(runningTask)}
                data-testid="button-stop-active-task"
              >
                Stop Task
              </Button>
              <Button
                size="xs"
                variant="default"
                leftSection={<IconCalendar size={14} />}
                onClick={() => handleGoToRunningTaskDate(runningTask.date)}
                data-testid="button-go-to-active-task-date"
              >
                Go to {runningTask.date}
              </Button>
            </Group>
          </Stack>
        </Alert>
      )}

      <Table stickyHeader stickyHeaderOffset={0} data-testid="task-list-table">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={125}>Date</Table.Th>
            <Table.Th w={80}>Start</Table.Th>
            <Table.Th w={80}>End</Table.Th>
            <Table.Th>Project</Table.Th>
            <Table.Th>Comment</Table.Th>
            <Table.Th w={50}>Duration</Table.Th>
            <Table.Th w={90}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isRunningOutsideDateRange && runningTask && (
            <Table.Tr
              key={`active-external-${runningTask.id}`}
              data-testid="active-running-task-row"
              bg="var(--mantine-color-orange-light)"
            >
              <Table.Td>
                <Group gap={4} wrap="nowrap">
                  <Badge color="orange" size="xs">
                    Active
                  </Badge>
                  <Text size="xs">{runningTask.date}</Text>
                </Group>
              </Table.Td>
              <Table.Td>
                <Text size="xs">{runningTask.timeStart}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="xs" c="dimmed">
                  —
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="xs">{runningTask.project}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="xs">{runningTask.comment || ""}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="xs">...</Text>
              </Table.Td>
              <Table.Td>
                <ActionIcon
                  variant="light"
                  color="orange"
                  size="md"
                  aria-label="Stop Task"
                  onClick={() => handleStopRunningTask(runningTask)}
                  data-testid="button-stop-external-active-task"
                >
                  <IconClockPause />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          )}
          {sortedTasks.map((task) => (
            <TaskListRow key={task.id} taskId={task.id} />
          ))}
          <Table.Tr>
            <Table.Td colSpan={6}>
              <Space h="md" />
            </Table.Td>
          </Table.Tr>
          {canAddTask && <AddEntryRow />}
        </Table.Tbody>
      </Table>
    </>
  );
}
