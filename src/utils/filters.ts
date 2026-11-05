import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { Task } from "../models/Task";
import { normalizeDate } from "./date";

dayjs.extend(isBetween);

export function filterTasksByDateRange(
  selectedDateRange: [string | null, string | null],
): (value: Task, index?: number, array?: Task[]) => boolean {
  const [rawStart, rawEnd] = selectedDateRange;

  if (rawStart === null && rawEnd === null) {
    return (_task) => true;
  }

  const startDate = normalizeDate(rawStart);
  if (rawEnd === null || rawStart === rawEnd) {
    return (task) => {
      const taskDate = normalizeDate(task.date);
      return (
        taskDate !== null &&
        startDate !== null &&
        taskDate.isSame(startDate, "day")
      );
    };
  }

  const endDate = normalizeDate(rawEnd);
  return (task) => {
    const taskDate = normalizeDate(task.date);
    return (
      taskDate !== null &&
      startDate !== null &&
      endDate !== null &&
      taskDate.isBetween(startDate, endDate, "day", "[]")
    );
  };
}
