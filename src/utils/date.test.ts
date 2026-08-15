import { describe, expect, it } from "vitest";
import { normalizeDate } from "./date";

describe("normalizeDate", () => {
  it("returns null for null input", () => {
    expect(normalizeDate(null)).toBeNull();
  });

  it("extracts the YYYY-MM-DD prefix from ISO datetime values", () => {
    const normalized = normalizeDate("2024-01-15T23:59:59.999Z");

    expect(normalized).not.toBeNull();
    expect(normalized?.format("YYYY-MM-DD")).toBe("2024-01-15");
  });

  it("keeps plain YYYY-MM-DD values as the same calendar day", () => {
    const normalized = normalizeDate("2024-01-16");

    expect(normalized).not.toBeNull();
    expect(normalized?.isValid()).toBe(true);
    expect(normalized?.format("YYYY-MM-DD")).toBe("2024-01-16");
  });

  it("passes through non-prefixed strings to dayjs parsing", () => {
    const normalized = normalizeDate("not-a-date");

    expect(normalized).not.toBeNull();
    expect(normalized?.isValid()).toBe(false);
  });
});
