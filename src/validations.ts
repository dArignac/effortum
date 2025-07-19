import dayjs from "dayjs";

export const validateDate = (value: string | null) =>
  value ? null : "Date is required";

export const validateStart = (value: string) =>
  value ? null : "Start time is required";

export const validateEnd = (end: string, start: string) => {
  if (end) {
    return dayjs(`${dayjs().format("YYYY-MM-DD")} ${end}`).isBefore(
      dayjs(`${dayjs().format("YYYY-MM-DD")} ${start}`),
    )
      ? "End time must be after start time"
      : null;
  }
  return null;
};

export const validateProject = (value: string) =>
  value ? null : "Project is required";
