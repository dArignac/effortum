import dayjs from "dayjs";

export const validateDate = (value: string | null) =>
  value ? null : "Date is required";

export const validateStart = (value: string) =>
  value ? null : "Start time is required";

export const validateEnd = (end: string, start: string) => {
  if (!end) {
    return null;
  }
  const today = dayjs().format("YYYY-MM-DD");
  return dayjs(`${today} ${end}`).isBefore(dayjs(`${today} ${start}`))
    ? "End time must be after start time"
    : null;
};

export const validateProject = (value: string) =>
  value ? null : "Project is required";
