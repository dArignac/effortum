import { ActionIcon, Box, Checkbox, Table } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconClipboardList } from "@tabler/icons-react";
import { useState } from "react";
import { useEffortumStore } from "../store";
import { filterTasksByDateRange } from "../utils/filters";
import { formatDuration, getDuration } from "../utils/time";

export function Summary() {
  const [listByTasks, setListByTasks] = useState(false);
  const tasks = useEffortumStore((state) => state.tasks);
  const selectedDateRange = useEffortumStore(
    (state) => state.selectedDateRange,
  );

  const filteredTasks = tasks.filter(filterTasksByDateRange(selectedDateRange));

  const commentProjectCount = filteredTasks.reduce(
    (acc, task) => {
      const comment = (task.comment?.trim() ?? "") || "(No comment)";
      if (!acc[comment]) {
        acc[comment] = new Set();
      }
      acc[comment].add(task.project);
      return acc;
    },
    {} as Record<string, Set<string>>,
  );

  const data = Object.values(
    filteredTasks.reduce(
      (acc, task) => {
        const comment = (task.comment?.trim() ?? "") || "(No comment)";

        const key = listByTasks
          ? (commentProjectCount[comment]?.size ?? 0) > 1
            ? `${task.project}: ${comment}`
            : comment
          : task.project;

        acc[key] = acc[key]
          ? {
              label: key,
              time: acc[key].time + getDuration(task.timeStart, task.timeEnd),
            }
          : {
              label: key,
              time: getDuration(task.timeStart, task.timeEnd),
            };
        return acc;
      },
      {} as Record<string, { label: string; time: number }>,
    ),
  ).sort((a, b) => a.label.localeCompare(b.label));

  const timeSum = data.reduce((sum, item) => sum + item.time, 0);

  const copyTasksOfProjectToClipboard = (project: string) => {
    const text = Array.from(
      new Set(
        filteredTasks
          .filter((task) => task.project === project)
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
                data-test-id="checkbox-list-by-task"
                label="List by task"
                mb={20}
                checked={listByTasks}
                onChange={() => setListByTasks(!listByTasks)}
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
                      onClick={() => copyTasksOfProjectToClipboard(item.label)}
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
          <Table.Tr>
            <Table.Td w={20}></Table.Td>
            <Table.Td w={50}>{formatDuration(timeSum)}</Table.Td>
            <Table.Td>
              <strong>Sum</strong>
            </Table.Td>
          </Table.Tr>
        </Table.Tfoot>
      </Table>
    </>
  );
}
