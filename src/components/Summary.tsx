import { BarChart } from "@mantine/charts";
import { Grid } from "@mantine/core";
import dayjs from "dayjs";
import { useProjectsContext } from "../contexts/ProjectsContext";
import { useTasksContext } from "../contexts/TasksContext";
import { formatDuration, getDuration } from "../utils/time";

export function Summary() {
  const { projects } = useProjectsContext();
  const { tasks } = useTasksContext();

  // TODO is set to month, should be day
  const data = Object.values(
    tasks
      .filter((task) => dayjs(task.date).isSame(dayjs(), "month"))
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
      <Grid.Col span={12}>TODO data selector</Grid.Col>
      <Grid.Col span={12}>
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
      </Grid.Col>
    </Grid>
  );
}
