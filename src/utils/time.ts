import dayjs from "dayjs";

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
