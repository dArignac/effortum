import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { Task } from "../models/Task";
import { normalizeDate } from "./date";

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
      const taskDate = normalizeDate(task.date);
      const selectedDate = normalizeDate(selectedDateRange[0]);
      return (
        taskDate !== null &&
        selectedDate !== null &&
        taskDate.isSame(selectedDate, "day")
      );
    }
    const taskDate = normalizeDate(task.date);
    const startDate = normalizeDate(selectedDateRange[0]);
    const endDate = normalizeDate(selectedDateRange[1]);
    return (
      taskDate !== null &&
      startDate !== null &&
      endDate !== null &&
      taskDate.isBetween(startDate, endDate, "day", "[]")
    );
  };
}
