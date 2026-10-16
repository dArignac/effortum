import { ActionIcon, Box, Checkbox, Table } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconClipboardList } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Task } from "../models/Task";
import { useEffortumStore } from "../store";
import { filterTasksByDateRange } from "../utils/filters";
import {
  formatDuration,
  getDuration,
  getRunningDuration,
  isRunningTask,
} from "../utils/time";

/**
 * Renders grouped task totals and summary rows for the selected date range,
 * including an optional running-task-inclusive total.
 */
export function Summary() {
  const [listByTasks, setListByTasks] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());
  const tasks = useEffortumStore((state) => state.tasks);
  const projects = useEffortumStore((state) => state.projects);
  const selectedDateRange = useEffortumStore(
    (state) => state.selectedDateRange,
  );

  const filteredTasks = tasks.filter(filterTasksByDateRange(selectedDateRange));
  const projectNameById = new Map(
    projects.map((project) => [project.id, project.name]),
  );

  const getProjectName = (projectId: string, legacyName?: string): string => {
    return projectNameById.get(projectId) || legacyName || "(Unknown project)";
  };

  const commentProjectCount = filteredTasks.reduce<Record<string, Set<string>>>(
    (acc, task) => {
      const comment = (task.comment?.trim() ?? "") || "(No comment)";
      const projectName = getProjectName(task.projectId, task.project);
      if (!acc[comment]) {
        acc[comment] = new Set();
      }
      acc[comment].add(projectName);
      return acc;
    },
    Object.create(null) as Record<string, Set<string>>,
  );

  const data = Object.values(
    filteredTasks.reduce<
      Record<string, { label: string; time: number; projectId?: string }>
    >(
      (acc, task) => {
        const comment = (task.comment?.trim() ?? "") || "(No comment)";
        const projectName = getProjectName(task.projectId, task.project);

        const key = listByTasks
          ? (commentProjectCount[comment]?.size ?? 0) > 1
            ? `${projectName}: ${comment}`
            : comment
          : projectName;

        if (acc[key]) {
          acc[key] = {
            ...acc[key],
            time: acc[key].time + getDuration(task.timeStart, task.timeEnd),
          };
        } else {
          acc[key] = {
            label: key,
            time: getDuration(task.timeStart, task.timeEnd),
            projectId: listByTasks ? undefined : task.projectId,
          };
        }

        return acc;
      },
      Object.create(null) as Record<
        string,
        { label: string; time: number; projectId?: string }
      >,
    ),
  ).sort((a, b) => a.label.localeCompare(b.label));

  const timeSum = data.reduce((sum, item) => sum + item.time, 0);
  const runningTasks = filteredTasks.filter(isRunningTask);
  const shouldShowRunningSum = runningTasks.length > 0;

  const [prevShouldShowRunningSum, setPrevShouldShowRunningSum] =
    useState(false);
  if (shouldShowRunningSum && !prevShouldShowRunningSum) {
    setPrevShouldShowRunningSum(true);
    setCurrentTimestamp(Date.now());
  } else if (!shouldShowRunningSum && prevShouldShowRunningSum) {
    setPrevShouldShowRunningSum(false);
  }

  useEffect(() => {
    if (!shouldShowRunningSum) {
      return;
    }

    setCurrentTimestamp(Date.now());

    const intervalId = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [shouldShowRunningSum]);

  const runningDuration = shouldShowRunningSum
    ? runningTasks.reduce(
        (sum, task) => sum + getRunningDuration(task, currentTimestamp),
        0,
      )
    : 0;
  const timeSumIncludingRunning = timeSum + runningDuration;

  const copyTasksOfProjectToClipboard = (projectId: string) => {
    const text = Array.from(
      new Set(
        filteredTasks
          .filter((task) => task.projectId === projectId)
          .filter((task) => task.comment)
          .map((task) => task.comment as string),
      ),
    )
      .sort((a, b) => a.localeCompare(b))
      .join("\n");
    navigator.clipboard.writeText(text).catch((err) => {
      console.error("Could not copy text: ", err);
      notifications.show({
        message: "Failed to copy comments to clipboard.",
        color: "red",
      });
    });
  };

  return (
    <>
      <Table verticalSpacing={4} horizontalSpacing={4} withRowBorders={false}>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td colSpan={3}>
              <Checkbox
                data-testid="checkbox-list-by-task"
                label="List by task"
                mb={20}
                checked={listByTasks}
                onChange={() => setListByTasks((prev) => !prev)}
              />
            </Table.Td>
          </Table.Tr>
          {data.map((item) => (
            <Table.Tr key={item.label}>
              <Table.Td w={15}>
                {!listByTasks ? (
                  <Box>
                    <ActionIcon
                      variant="filled"
                      aria-label="Copy comments of project"
                      size={20}
                      onClick={() =>
                        item.projectId &&
                        copyTasksOfProjectToClipboard(item.projectId)
                      }
                      data-testid={`button-copy-comments-${item.label}`}
                    >
                      <IconClipboardList size={16} />
                    </ActionIcon>
                  </Box>
                ) : null}
              </Table.Td>
              <Table.Td w={50}>
                <Box>{formatDuration(item.time)}</Box>
              </Table.Td>
              <Table.Td>
                <Box>{item.label}</Box>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
        <Table.Tfoot h={60}>
          <Table.Tr data-testid="summary-sum-row">
            <Table.Td w={20}></Table.Td>
            <Table.Td w={50} data-testid="summary-sum-value">
              {formatDuration(timeSum)}
            </Table.Td>
            <Table.Td>
              <strong>Sum</strong>
            </Table.Td>
          </Table.Tr>
          {shouldShowRunningSum && (
            <Table.Tr data-testid="summary-sum-including-running-row">
              <Table.Td w={20}></Table.Td>
              <Table.Td
                w={50}
                data-testid="summary-sum-including-running-value"
              >
                {formatDuration(timeSumIncludingRunning)}
              </Table.Td>
              <Table.Td>
                <em>Sum (w/ running tasks)</em>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tfoot>
      </Table>
    </>
  );
}
