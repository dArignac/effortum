import { Box, Flex, SimpleGrid } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { Fragment, useEffect } from "react";
import { useEffortumStore } from "../store";
import { filterTasksByDateRange } from "../utils/filters";
import { formatDuration, getDuration } from "../utils/time";

dayjs.extend(isBetween);

export function Summary() {
  const tasks = useEffortumStore((state) => state.tasks);
  const selectedDateRange = useEffortumStore(
    (state) => state.selectedDateRange,
  );
  const setSelectedDateRange = useEffortumStore(
    (state) => state.setSelectedDateRange,
  );

  useEffect(() => {
    setSelectedDateRange([
      dayjs().format("YYYY-MM-DD"),
      dayjs().format("YYYY-MM-DD"),
    ]);
  }, [setSelectedDateRange]);

  const data = Object.values(
    tasks.filter(filterTasksByDateRange(selectedDateRange)).reduce(
      (acc, task) => {
        acc[task.project] = acc[task.project]
          ? {
              project: task.project,
              time:
                acc[task.project].time +
                getDuration(task.timeStart, task.timeEnd),
            }
          : {
              project: task.project,
              time: getDuration(task.timeStart, task.timeEnd),
            };
        return acc;
      },
      {} as Record<string, { project: string; time: number }>,
    ),
  ).sort((a, b) => a.project.localeCompare(b.project));

  return (
    <Flex
      mih={50}
      gap="sm"
      justify="flex-start"
      align="flex-start"
      direction="column"
      wrap="wrap"
    >
      <DatePicker
        type="range"
        allowSingleDateInRange
        value={selectedDateRange}
        onChange={(value) => setSelectedDateRange(value || [null, null])}
        size="xs"
      />
      <SimpleGrid cols={2} spacing="xs" verticalSpacing="xs" mt={5}>
        {data.map((task, idx) => (
          <Fragment key={idx}>
            <Box component="strong">{task.project}:</Box>
            <Box>{formatDuration(task.time)}</Box>
          </Fragment>
        ))}
      </SimpleGrid>
    </Flex>
  );
}
