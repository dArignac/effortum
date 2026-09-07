import { useEffortumStore } from "@/store";
import { Text } from "@mantine/core";
import { useEffect, useState } from "react";

export function ProjectHoursSum(props: { projectId: string }) {
  const getProjectBookedTimeHours = useEffortumStore(
    (state) => state.getProjectBookedTimeHours,
  );
  const [sum, setSum] = useState<number>(0);

  useEffect(() => {
    let isActive = true;

    const loadSum = async () => {
      const value = await getProjectBookedTimeHours(props.projectId);

      if (isActive) {
        setSum(value);
      }
    };

    loadSum();

    return () => {
      isActive = false;
    };
  }, [getProjectBookedTimeHours, props.projectId]);

  return (
    <Text
      size="sm"
      c="dimmed"
      data-testid={`project-task-hours-sum-${props.projectId}`}
    >
      {sum.toFixed(2)} h
    </Text>
  );
}
