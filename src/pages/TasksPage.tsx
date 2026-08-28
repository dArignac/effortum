import { Stack, Text } from "@mantine/core";

export function TasksPage() {
  return (
    <Stack data-testid="tasks-page" gap="xs">
      <Text data-testid="tasks-page-header">Tasks Page</Text>
      <Text c="dimmed">This page is currently empty.</Text>
    </Stack>
  );
}