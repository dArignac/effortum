import dayjs from "dayjs";

export function normalizeDate(value: string | null): dayjs.Dayjs | null {
  if (value === null) {
    return null;
  }
  const datePrefixMatch = value.match(/^\d{4}-\d{2}-\d{2}/);
  const normalizedValue = datePrefixMatch ? datePrefixMatch[0] : value;
  return dayjs(normalizedValue);
}
