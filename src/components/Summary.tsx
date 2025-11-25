import { Box, Button, Flex, Indicator, SimpleGrid } from "@mantine/core";
import { DatePicker, DatePickerProps } from "@mantine/dates";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isToday from "dayjs/plugin/isToday";
import { Fragment, useEffect } from "react";
import { useEffortumStore } from "../store";
import { filterTasksByDateRange } from "../utils/filters";
import { formatDuration, getDuration } from "../utils/time";

dayjs.extend(isBetween);
dayjs.extend(isToday);

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

  const copyTasksToClipboard = () => {
    const text = tasks
      .filter(filterTasksByDateRange(selectedDateRange))
      .map((task) => `${task.comment}`)
      .sort((a, b) => a.localeCompare(b))
      .join("\n");
    navigator.clipboard.writeText(text);
  };

  const dayRenderer: DatePickerProps["renderDay"] = (date) => {
    const day = dayjs(date).date();
    return (
      <Indicator
        size={6}
        position="bottom-center"
        color="green"
        disabled={!dayjs(date).isToday()}
      >
        <div>{day}</div>
      </Indicator>
    );
  };

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
        renderDay={dayRenderer}
      />
      <SimpleGrid cols={2} spacing="xs" verticalSpacing="xs" mt={5}>
        {data.map((task, idx) => (
          <Fragment key={idx}>
            <Box component="strong">{task.project}:</Box>
            <Box>{formatDuration(task.time)}</Box>
          </Fragment>
        ))}
      </SimpleGrid>
      <Button size="compact-xs" onClick={copyTasksToClipboard}>
        Copy to clipboard
      </Button>
    </Flex>
  );
}
