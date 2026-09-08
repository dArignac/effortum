import { StoreGet, StoreSet } from "@/store/types";

export const createUiSlice = (_set: StoreSet, _get: StoreGet) => ({
  selectedDateRange: [null, null] as [string | null, string | null],
  endTimeOfLastStoppedTask: null,
  isDataLoading: false,

  setSelectedDateRange: (range: [string | null, string | null]) => {
    _set({ selectedDateRange: range });
  },

  setEndTimeOfLastStoppedTask: (time: string | null) => {
    _set({ endTimeOfLastStoppedTask: time });
  },
});
