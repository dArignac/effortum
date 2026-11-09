import { StoreGet, StoreSet } from "@/store/types";

export const createUiSlice = (set: StoreSet, _get: StoreGet) => ({
  selectedDateRange: [null, null] as [string | null, string | null],
  endTimeOfLastStoppedTask: null,
  isDataLoading: false,

  setSelectedDateRange: (range: [string | null, string | null]) => {
    set({ selectedDateRange: range });
  },

  setEndTimeOfLastStoppedTask: (time: string | null) => {
    set({ endTimeOfLastStoppedTask: time });
  },
});
