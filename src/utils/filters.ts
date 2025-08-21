import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { Task } from "../models/Task";

dayjs.extend(isBetween);

export function filterTasksByDateRange(
  selectedDateRange: [string | null, string | null],
): (value: Task, index: number, array: Task[]) => boolean {
  return (task) => {
    if (selectedDateRange[0] === null && selectedDateRange[1] === null) {
      return true;
    }
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
