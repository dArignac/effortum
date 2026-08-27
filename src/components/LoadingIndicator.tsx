import { Center, Loader, Text } from "@mantine/core";

export function LoadingIndicator() {
  return (
    <Center style={{ padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <Loader color="blue" size="lg" mb="md" />
        <Text>Loading tasks...</Text>
      </div>
    </Center>
  );
}