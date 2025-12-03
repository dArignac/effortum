import { ExportData } from "@/components/ExportData";
import { Summary } from "@/components/Summary";
import { TaskList } from "@/components/TaskList";
import { VERSION } from "@/version";
import { Center, Container, Grid, Text } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ ssr: false, component: App });

function App() {
  return (
    <>
      <Grid overflow="hidden">
        <Grid.Col span={8}>
          <TaskList />
        </Grid.Col>
        <Grid.Col span={4}>
          <Summary />
        </Grid.Col>
      </Grid>
      <Container size="xs" mt={40}>
        <Center>
          <Text size="xs">Version: {VERSION} </Text>
        </Center>
        <Center mt={10}>
          <ExportData />
        </Center>
      </Container>
    </>
  );
}
