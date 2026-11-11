import { ActionIcon, Box, Checkbox, Table, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconClipboardList } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { Task } from "../models/Task";
import { useEffortumStore } from "../store";
import {
  calculateOverlappingBudgetSpentHours,
  formatSummaryBudgetDepletion,
  getOverlappingBudgetHours,
} from "../utils/budget";
import { filterTasksByDateRange } from "../utils/filters";
import {
  formatDuration,
  formatPercentage,
  getDuration,
  getRunningDuration,
  isRunningTask,
} from "../utils/time";

type SummaryItem = {
  label: string;
  time: number;
  projectId?: string;
};

function buildSummaryItems(
  filteredTasks: ReadonlyArray<Task>,
  projectNameById: ReadonlyMap<string, string>,
  listByTasks: boolean,
): SummaryItem[] {
  const getProjectName = (task: Task): string =>
    projectNameById.get(task.projectId) || task.project || "(Unknown project)";
  const getTaskComment = (task: Task): string =>
    (task.comment?.trim() ?? "") || "(No comment)";

  const projectsPerComment = new Map<string, Set<string>>();
  if (listByTasks) {
    for (const task of filteredTasks) {
      const comment = getTaskComment(task);
      let projectNames = projectsPerComment.get(comment);
      if (!projectNames) {
        projectNames = new Set<string>();
        projectsPerComment.set(comment, projectNames);
      }
      projectNames.add(getProjectName(task));
    }
  }

  const itemsByKey = new Map<string, SummaryItem>();
  for (const task of filteredTasks) {
    const projectName = getProjectName(task);
    let key = projectName;
    if (listByTasks) {
      const comment = getTaskComment(task);
      const isSharedAcrossProjects =
        (projectsPerComment.get(comment)?.size ?? 0) > 1;
      key = isSharedAcrossProjects ? `${projectName}: ${comment}` : comment;
    }

    const duration = getDuration(task.timeStart, task.timeEnd);
    const existing = itemsByKey.get(key);
    if (existing) {
      existing.time += duration;
    } else {
      itemsByKey.set(key, {
        label: key,
        time: duration,
        projectId: listByTasks ? undefined : task.projectId,
      });
    }
  }

  return Array.from(itemsByKey.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

/**
 * Renders grouped task totals and summary rows for the selected date range,
 * including an optional running-task-inclusive total.
 */
export function Summary() {
  const [listByTasks, setListByTasks] = useState(false);
  const [showPercentages, setShowPercentages] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());
  const [spentHoursByProject, setSpentHoursByProject] = useState<
    Record<string, number>
  >({});
  const tasks = useEffortumStore((state) => state.tasks);
  const projects = useEffortumStore((state) => state.projects);
  const budgets = useEffortumStore((state) => state.budgets);
  const selectedDateRange = useEffortumStore(
    (state) => state.selectedDateRange,
  );
  const getProjectBudgetSpentHours = useEffortumStore(
    (state) => state.getProjectBudgetSpentHours,
  );

  const filteredTasks = useMemo(
    () => tasks.filter(filterTasksByDateRange(selectedDateRange)),
    [tasks, selectedDateRange],
  );
  const projectNameById = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );

  const data = useMemo(
    () => buildSummaryItems(filteredTasks, projectNameById, listByTasks),
    [filteredTasks, projectNameById, listByTasks],
  );

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

  useEffect(() => {
    let isMounted = true;
    const projectIds = Array.from(
      new Set(
        data
          .map((item) => item.projectId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    if (projectIds.length === 0) {
      return;
    }

    for (const projectId of projectIds) {
      getProjectBudgetSpentHours(projectId, selectedDateRange)
        .then((spentHours) => {
          if (!isMounted) return;
          setSpentHoursByProject((prev) => {
            if (prev[projectId] === spentHours) {
              return prev;
            }
            return {
              ...prev,
              [projectId]: spentHours,
            };
          });
        })
        .catch((error) => {
          console.error("Failed to load budget spent hours:", error);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [data, selectedDateRange, budgets, tasks, getProjectBudgetSpentHours]);

  const copyTasksOfProjectToClipboard = (projectId: string) => {
    const comments = new Set<string>();
    for (const task of filteredTasks) {
      if (task.projectId === projectId && task.comment) {
        comments.add(task.comment);
      }
    }
    const text = Array.from(comments)
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
    <Table verticalSpacing={4} horizontalSpacing={4} withRowBorders={false}>
      <Table.Tbody>
        <Table.Tr>
          <Table.Td colSpan={3}>
            <Checkbox
              data-testid="checkbox-list-by-task"
              label="List by task"
              mb={10}
              checked={listByTasks}
              onChange={() => setListByTasks((prev) => !prev)}
            />
            <Checkbox
              data-testid="checkbox-show-percentages"
              label="Project allocation (%)"
              mb={20}
              checked={showPercentages}
              onChange={() => setShowPercentages((prev) => !prev)}
            />
          </Table.Td>
        </Table.Tr>
        {data.map((item) => {
          const budgetHours =
            !listByTasks && item.projectId
              ? getOverlappingBudgetHours(
                  budgets,
                  item.projectId,
                  selectedDateRange,
                )
              : 0;

          const inMemorySpent =
            !listByTasks && item.projectId && budgetHours > 0
              ? calculateOverlappingBudgetSpentHours(
                  budgets,
                  tasks,
                  item.projectId,
                  selectedDateRange,
                )
              : 0;

          const spentHours =
            item.projectId && item.projectId in spentHoursByProject
              ? spentHoursByProject[item.projectId]
              : inMemorySpent;

          const budgetDepletion =
            budgetHours > 0
              ? formatSummaryBudgetDepletion(spentHours, budgetHours)
              : null;

          return (
            <Table.Tr key={item.label}>
              <Table.Td w={15} style={{ verticalAlign: "top" }}>
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
              <Table.Td w={50} style={{ verticalAlign: "top" }}>
                <Box>{formatDuration(item.time)}</Box>
                {showPercentages && (
                  <Box data-testid={`summary-percentage-${item.label}`}>
                    {formatPercentage(item.time, timeSum)}
                  </Box>
                )}
              </Table.Td>
              <Table.Td style={{ verticalAlign: "top" }}>
                <Box>{item.label}</Box>
                {budgetDepletion && (
                  <Tooltip label={budgetDepletion.tooltip}>
                    <Box
                      data-testid={`summary-budget-depletion-${item.label}`}
                      style={{ width: "fit-content" }}
                    >
                      {budgetDepletion.label}
                    </Box>
                  </Tooltip>
                )}
              </Table.Td>
            </Table.Tr>
          );
        })}
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
            <Table.Td w={50} data-testid="summary-sum-including-running-value">
              {formatDuration(timeSumIncludingRunning)}
            </Table.Td>
            <Table.Td>
              <em>Sum (w/ running tasks)</em>
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tfoot>
    </Table>
  );
}
