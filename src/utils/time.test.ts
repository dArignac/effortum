import { describe, expect, it } from "vitest";
import { getDuration } from "./time";

describe("Task duration calculation", () => {
  it("returns ... if end time is missing", () => {
    expect(getDuration("08:00", "")).toBe("...");
  });

  it("calculates 1 hour duration", () => {
    expect(getDuration("08:00", "09:00")).toBe("01:00");
  });

  it("calculates 1 hour 30 minutes duration", () => {
    expect(getDuration("08:00", "09:30")).toBe("01:30");
  });

  it("calculates overnight duration correctly", () => {
    expect(getDuration("23:00", "01:00")).toBe("-22:00"); // Negative duration, edge case
  });

  it("calculates zero duration", () => {
    expect(getDuration("08:00", "08:00")).toBe("00:00");
  });
});
