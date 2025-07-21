import { BarChart } from "@mantine/charts";
import { Grid } from "@mantine/core";
import { useProjectsContext } from "../contexts/ProjectsContext";
import { useTasksContext } from "../contexts/TasksContext";
import dayjs from "dayjs";
import { getDuration, getDurationAsTime } from "../utils/time";

export function Summary() {
  const { projects } = useProjectsContext();
  const { tasks } = useTasksContext();

  // TODO temporarily until dat selection is implemented
  const filteredTasks = tasks.filter((task) =>
    dayjs(task.date).isSame(dayjs(), "month"),
  );

  let data = [
    { project: "Project A", time: 120 },
    { project: "Project B", time: 90 },
    { project: "Project C", time: 200 },
  ];

  data = filteredTasks.map((task) => ({
    project: task.project,
    time: getDuration(task.timeStart, task.timeEnd), // TODO should have human readable label
  }));

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
          withBarValueLabel
          series={[{ name: "time", color: "violet.6" }]}
        />
      </Grid.Col>
    </Grid>
  );
}
