import dayjs from "dayjs";

const REFERENCE_DATE = "2000-01-01";

export function roundTimeToNearest5Minutes(time: string): string {
  if (!time) return time;

  const parsedTime = dayjs(`${REFERENCE_DATE} ${time}`);
  if (!parsedTime.isValid()) return time;

  const minute = parsedTime.minute();
  const tens = Math.floor(minute / 10) * 10;
  const ones = minute % 10;

  let roundedMinute = tens;
  if (ones > 6) {
    roundedMinute = tens + 10;
  } else if (ones > 2) {
    roundedMinute = tens + 5;
  }

  const minutesInDay = 24 * 60;
  const roundedTotalMinutes = parsedTime.hour() * 60 + roundedMinute;
  const normalizedMinutes =
    ((roundedTotalMinutes % minutesInDay) + minutesInDay) % minutesInDay;

  return formatDuration(normalizedMinutes);
}

export function applyTimeRounding(
  time: string,
  roundToNearest5Minutes: boolean,
): string {
  if (!time) return "";
  return roundToNearest5Minutes ? roundTimeToNearest5Minutes(time) : time;
}

export function getDurationAsTime(start: string, end?: string): string {
  if (end === undefined || end === "") return "...";
  return formatDuration(getDuration(start, end));
}

export function getDuration(start: string, end?: string): number {
  if (end === undefined || end === "") return 0;
  const startTime = dayjs(`${REFERENCE_DATE} ${start}`);
  const endTime = dayjs(`${REFERENCE_DATE} ${end}`);
  return endTime.diff(startTime, "minute");
}

export function formatDuration(duration: number): string {
  const hours = Math.floor(duration / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (duration % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Calculates the percentage of a part relative to a total.
 * Returns an integer rounded mathematically (Math.round).
 * Returns 0 if total <= 0 or part <= 0.
 */
export function calculatePercentage(part: number, total: number): number {
  if (total <= 0 || part <= 0) {
    return 0;
  }
  return Math.round((part / total) * 100);
}

/**
 * Formats the percentage as "X %" (e.g. "17 %").
 */
export function formatPercentage(part: number, total: number): string {
  return `${calculatePercentage(part, total)} %`;
}

/**
 * Returns whether a task is currently running (no end time).
 */
export function isRunningTask(task: { timeEnd?: string }): boolean {
  return !task.timeEnd || task.timeEnd.length === 0;
}

/**
 * Computes elapsed running minutes for an active task from its start datetime to now.
 */
export function getRunningDuration(
  task: { date: string; timeStart: string },
  currentTimestamp: number,
): number {
  if (!task.timeStart || task.timeStart.trim().length === 0) {
    return 0;
  }
  const startDateTime = dayjs(`${task.date} ${task.timeStart}`);
  if (!startDateTime.isValid()) {
    return 0;
  }

  const duration = dayjs(currentTimestamp).diff(startDateTime, "minute");
  return duration > 0 ? duration : 0;
}
