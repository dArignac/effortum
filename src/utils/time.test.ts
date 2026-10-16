import { describe, expect, it } from "vitest";
import {
  getDurationAsTime,
  getRunningDuration,
  isRunningTask,
  roundTimeToNearest5Minutes,
} from "./time";

describe("Task duration calculation", () => {
  it("returns ... if end time is missing", () => {
    expect(getDurationAsTime("08:00", "")).toBe("...");
  });

  it("calculates 1 hour duration", () => {
    expect(getDurationAsTime("08:00", "09:00")).toBe("01:00");
  });

  it("calculates 1 hour 30 minutes duration", () => {
    expect(getDurationAsTime("08:00", "09:30")).toBe("01:30");
  });

  it("calculates overnight duration correctly", () => {
    expect(getDurationAsTime("23:00", "01:00")).toBe("-22:00"); // Negative duration, edge case
  });

  it("calculates zero duration", () => {
    expect(getDurationAsTime("08:00", "08:00")).toBe("00:00");
  });
});

describe("Round time to nearest 5 minutes", () => {
  it.each([
    ["10:01", "10:00"],
    ["10:02", "10:00"],
    ["10:04", "10:05"],
    ["10:06", "10:05"],
    ["10:07", "10:10"],
    ["10:09", "10:10"],
    ["10:15", "10:15"],
    ["10:58", "11:00"],
    ["23:58", "00:00"],
  ])("Round %s to %s", (input, expected) => {
    expect(roundTimeToNearest5Minutes(input)).toBe(expected);
  });
});

describe("isRunningTask", () => {
  it("returns true when timeEnd is undefined or empty string", () => {
    expect(isRunningTask({})).toBe(true);
    expect(isRunningTask({ timeEnd: "" })).toBe(true);
  });

  it("returns false when timeEnd is set", () => {
    expect(isRunningTask({ timeEnd: "10:00" })).toBe(false);
  });
});

describe("getRunningDuration", () => {
  it("calculates duration in minutes between start time and current timestamp", () => {
    const timestamp = new Date("2026-10-16T10:45:00").getTime();
    expect(
      getRunningDuration({ date: "2026-10-16", timeStart: "09:15" }, timestamp),
    ).toBe(90);
  });

  it("handles single-digit hour format", () => {
    const timestamp = new Date("2026-10-16T10:45:00").getTime();
    expect(
      getRunningDuration({ date: "2026-10-16", timeStart: "9:15" }, timestamp),
    ).toBe(90);
  });

  it("returns 0 when task start time is in the future", () => {
    const timestamp = new Date("2026-10-16T09:00:00").getTime();
    expect(
      getRunningDuration({ date: "2026-10-16", timeStart: "10:00" }, timestamp),
    ).toBe(0);
  });

  it("returns 0 when timeStart is empty or invalid", () => {
    const timestamp = new Date("2026-10-16T10:00:00").getTime();
    expect(
      getRunningDuration({ date: "2026-10-16", timeStart: "" }, timestamp),
    ).toBe(0);
    expect(
      getRunningDuration({ date: "2026-10-16", timeStart: "   " }, timestamp),
    ).toBe(0);
    expect(
      getRunningDuration(
        { date: "invalid-date", timeStart: "invalid-time" },
        timestamp,
      ),
    ).toBe(0);
  });
});
