import { BarChart } from "@mantine/charts";
import { Grid } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useState } from "react";
import { useTasksContext } from "../contexts/TasksContext";
import { formatDuration, getDuration } from "../utils/time";

dayjs.extend(isBetween);

export function Summary() {
  const { tasks } = useTasksContext();

  const [selectedDate, setSelectedDate] = useState<
    [string | null, string | null]
  >([dayjs().format("YYYY-MM-DD"), dayjs().format("YYYY-MM-DD")]);

  const data = Object.values(
    tasks
      .filter((task) => {
        if (selectedDate[1] === null || selectedDate[0] === selectedDate[1]) {
          return dayjs(task.date).isSame(dayjs(selectedDate[0]));
        }
        return dayjs(task.date).isBetween(
          dayjs(selectedDate[0]),
          dayjs(selectedDate[1]),
          "day",
          "[]",
        );
      })
      .reduce(
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
          value={selectedDate}
          onChange={(value) => setSelectedDate(value || "")}
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
