import { Grid } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { AddEntry } from "../components/AddEntry";
import { Summary } from "../components/Summary";
import { TimeList } from "../components/TimeList";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
});

function Home() {
  return (
    <Grid>
      <Grid.Col span={8}>
        <TimeList />
        <AddEntry />
      </Grid.Col>
      <Grid.Col span={4}>
        <Summary />
      </Grid.Col>
    </Grid>
  );
}
