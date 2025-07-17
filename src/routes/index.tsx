import { Grid } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { AddEntry } from "../components/AddEntry";
import { Summary } from "../components/Summary";
import { TaskList } from "../components/TaskList";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
});

function Home() {
  return (
    <Grid>
      <Grid.Col span={8}>
        <TaskList />
        <AddEntry />
      </Grid.Col>
      <Grid.Col span={4}>
        <Summary />
      </Grid.Col>
    </Grid>
  );
}
