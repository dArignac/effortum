import { Calendar } from "@/components/Calendar";
import { Summary } from "@/components/Summary";
import { TaskList } from "@/components/TaskList";
import { Flex, Grid } from "@mantine/core";

export function TimeCollector() {
  return (
    <Grid overflow="hidden">
      <Grid.Col span={8}>
        <TaskList />
      </Grid.Col>
      <Grid.Col span={4}>
        <Flex
          mih={50}
          gap="sm"
          justify="flex-start"
          align="flex-start"
          direction="column"
          wrap="wrap"
        >
          <Calendar />
          <Summary />
        </Flex>
      </Grid.Col>
    </Grid>
  );
}
