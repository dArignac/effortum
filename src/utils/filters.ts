import dayjs from "dayjs";
import { Task } from "../models/Task";

export function filterTasksByDateRange(
  selectedDateRange: [string | null, string | null],
): (value: Task, index: number, array: Task[]) => unknown {
  return (task) => {
    if (
      selectedDateRange[1] === null ||
      selectedDateRange[0] === selectedDateRange[1]
    ) {
      return dayjs(task.date).isSame(dayjs(selectedDateRange[0]));
    }
    return dayjs(task.date).isBetween(
      dayjs(selectedDateRange[0]),
      dayjs(selectedDateRange[1]),
      "day",
      "[]",
    );
  };
}
