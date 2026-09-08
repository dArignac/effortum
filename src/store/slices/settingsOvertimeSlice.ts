import { db } from "@/store/db";
import { StoreGet, StoreSet } from "@/store/types";

export const createSettingsOvertimeSlice = (
  _set: StoreSet,
  _get: StoreGet,
) => ({
  overtime: [],
  settings: [],

  updateOvertime: async (
    currentBalance: number,
    workingHoursPerDay: number,
  ) => {
    const overtimeValue = {
      id: "overtime-default",
      currentBalance,
      workingHoursPerDay,
    };

    await db.overtime.put(overtimeValue);

    _set({
      overtime: [overtimeValue],
    });
  },

  updateSettings: async (roundToNearest5Minutes: boolean) => {
    const settingsValue = {
      id: "settings-default",
      roundToNearest5Minutes,
    };

    await db.settings.put(settingsValue);

    _set({
      settings: [settingsValue],
    });
  },
});
