import { describe, expect, it, vi } from "vitest";
import { createUiSlice } from "./uiSlice";

describe("createUiSlice", () => {
  it("initializes default UI state", () => {
    const set = vi.fn();
    const get = vi.fn(() => ({}));

    const slice = createUiSlice(set as never, get as never);

    expect(slice.selectedDateRange).toEqual([null, null]);
    expect(slice.endTimeOfLastStoppedTask).toBeNull();
    expect(slice.isDataLoading).toBe(false);
  });

  it("updates selected date range", () => {
    const set = vi.fn();
    const get = vi.fn(() => ({}));

    const slice = createUiSlice(set as never, get as never);
    slice.setSelectedDateRange(["2026-09-01", "2026-09-08"]);

    expect(set).toHaveBeenCalledWith({
      selectedDateRange: ["2026-09-01", "2026-09-08"],
    });
  });

  it("updates end time of last stopped task", () => {
    const set = vi.fn();
    const get = vi.fn(() => ({}));

    const slice = createUiSlice(set as never, get as never);
    slice.setEndTimeOfLastStoppedTask("17:30");

    expect(set).toHaveBeenCalledWith({ endTimeOfLastStoppedTask: "17:30" });
  });
});
