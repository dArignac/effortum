import { describe, expect, it } from "vitest";
import { getDurationAsTime, roundTimeToNearest5Minutes } from "./time";

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
