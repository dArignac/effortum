import { Grid } from "@mantine/core";
import { Summary } from "./Summary";
import { TaskList } from "./TaskList";

export function TimeCollector() {
  return (
    <Grid overflow="hidden">
      <Grid.Col span={8}>
        <TaskList />
      </Grid.Col>
      <Grid.Col span={4}>
        <Summary />
      </Grid.Col>
    </Grid>
  );
}
