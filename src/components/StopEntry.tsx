import { ActionIcon } from "@mantine/core";
import { IconClockPause } from "@tabler/icons-react";
import { useTasksContext } from "../contexts/TasksContext";
import dayjs from "dayjs";

export function StopEntry(props: { taskId: string }) {
  const { tasks, setTasks } = useTasksContext();

  const task = tasks.find((task) => task.id === props.taskId);

  if (!task || (task.timeEnd && task.timeEnd.length > 0)) {
    return null; // No action needed if task is not found or already has an end time
  }

  const handleClick = () => {
    const updatedTasks = tasks.map((t) =>
      t.id === props.taskId ? { ...t, timeEnd: dayjs().format("HH:mm") } : t,
    );
    setTasks(updatedTasks);
  };

  return (
    <ActionIcon
      variant="light"
      size="sm"
      aria-label="Stop Task"
      onClick={handleClick}
    >
      <IconClockPause />
    </ActionIcon>
  );
}
