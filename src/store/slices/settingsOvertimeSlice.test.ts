import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSettingsOvertimeSlice } from "./settingsOvertimeSlice";

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    overtime: {
      put: vi.fn(),
    },
    settings: {
      put: vi.fn(),
    },
  },
}));

vi.mock("@/store/db", () => ({
  db: mockDb,
}));

describe("createSettingsOvertimeSlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes empty settings and overtime arrays", () => {
    const set = vi.fn();
    const get = vi.fn(() => ({}));

    const slice = createSettingsOvertimeSlice(set as never, get as never);

    expect(slice.overtime).toEqual([]);
    expect(slice.settings).toEqual([]);
  });

  it("stores overtime value in db and state", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({}));

    const slice = createSettingsOvertimeSlice(set as never, get as never);

    await slice.updateOvertime(12.5, 8);

    expect(mockDb.overtime.put).toHaveBeenCalledWith({
      id: "overtime-default",
      currentBalance: 12.5,
      workingHoursPerDay: 8,
    });
    expect(set).toHaveBeenCalledWith({
      overtime: [
        {
          id: "overtime-default",
          currentBalance: 12.5,
          workingHoursPerDay: 8,
        },
      ],
    });
  });

  it("stores settings value in db and state", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({}));

    const slice = createSettingsOvertimeSlice(set as never, get as never);

    await slice.updateSettings(true);

    expect(mockDb.settings.put).toHaveBeenCalledWith({
      id: "settings-default",
      roundToNearest5Minutes: true,
    });
    expect(set).toHaveBeenCalledWith({
      settings: [
        {
          id: "settings-default",
          roundToNearest5Minutes: true,
        },
      ],
    });
  });
});
