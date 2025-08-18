import { BarChart } from "@mantine/charts";
import { Grid } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useEffect } from "react";
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
    <Grid>
      <Grid.Col span={12} style={{ display: "flex", justifyContent: "center" }}>
        <DatePicker
          type="range"
          allowSingleDateInRange
          value={selectedDateRange}
          onChange={(value) => setSelectedDateRange(value || [null, null])}
          size="xs"
        />
      </Grid.Col>
      <Grid.Col span={12}>
        {data.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            No data available
          </div>
        ) : (
          <BarChart
            h={300}
            w={350}
            data={data}
            dataKey="project"
            orientation="vertical"
            barProps={{ barSize: 25 }}
            withBarValueLabel
            valueFormatter={(value) => formatDuration(value)}
            series={[{ name: "time", color: "blue.6" }]}
          />
        )}
      </Grid.Col>
    </Grid>
  );
}
