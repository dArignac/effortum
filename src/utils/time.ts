import dayjs from "dayjs";

export function getDuration(start: string, end?: string): string {
  if (end === undefined || end === "") return "...";
  const startTime = dayjs(`${dayjs().format("YYYY-MM-DD")} ${start}`);
  const endTime = dayjs(`${dayjs().format("YYYY-MM-DD")} ${end}`);
  const diff = endTime.diff(startTime, "minute");
  const hours = Math.floor(diff / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (diff % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}
