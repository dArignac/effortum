// src/routes/index.tsx
import { Grid } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { AddEntry } from "../components/add-entry";
import { Summary } from "../components/summary";
import { TimeList } from "../components/timelist";

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
