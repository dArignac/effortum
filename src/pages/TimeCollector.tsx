import { Summary } from "@/components/Summary";
import { TaskList } from "@/components/TaskList";
import { Grid } from "@mantine/core";

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
