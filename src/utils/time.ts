import dayjs from "dayjs";

export function roundTimeToNearest5Minutes(time: string): string {
  if (!time) return time;

  const parsedTime = dayjs(`${dayjs().format("YYYY-MM-DD")} ${time}`);
  if (!parsedTime.isValid()) return time;

  const totalMinutes = parsedTime.hour() * 60 + parsedTime.minute();
  const minuteWithinHour = totalMinutes % 60;
  const tens = Math.floor(minuteWithinHour / 10) * 10;
  const ones = minuteWithinHour % 10;

  let roundedMinuteWithinHour = tens;
  if (ones <= 2) {
    roundedMinuteWithinHour = tens;
  } else if (ones <= 6) {
    roundedMinuteWithinHour = tens + 5;
  } else {
    roundedMinuteWithinHour = tens + 10;
  }

  const roundedTotalMinutes =
    Math.floor(totalMinutes / 60) * 60 + roundedMinuteWithinHour;
  const minutesInDay = 24 * 60;
  const normalizedMinutes =
    ((roundedTotalMinutes % minutesInDay) + minutesInDay) % minutesInDay;

  const hours = Math.floor(normalizedMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (normalizedMinutes % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function getDurationAsTime(start: string, end?: string): string {
  if (end === undefined || end === "") return "...";
  const startTime = dayjs(`${dayjs().format("YYYY-MM-DD")} ${start}`);
  const endTime = dayjs(`${dayjs().format("YYYY-MM-DD")} ${end}`);
  const diff = endTime.diff(startTime, "minute");
  return formatDuration(diff);
}

export function getDuration(start: string, end?: string): number {
  if (end === undefined || end === "") return 0;
  const startTime = dayjs(`${dayjs().format("YYYY-MM-DD")} ${start}`);
  const endTime = dayjs(`${dayjs().format("YYYY-MM-DD")} ${end}`);
  return endTime.diff(startTime, "minute");
}

export function formatDuration(duration: number): string {
  const hours = Math.floor(duration / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (duration % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}
