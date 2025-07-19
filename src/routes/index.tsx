import { Grid } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { Summary } from "../components/Summary";
import { TaskList } from "../components/TaskList";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
});

function Home() {
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
