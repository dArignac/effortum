import { db } from "@/store/db";
import { createCommentSlice } from "@/store/slices/commentSlice";
import { createLoadingMigrationSlice } from "@/store/slices/loadingMigrationSlice";
import { createProjectSlice } from "@/store/slices/projectSlice";
import { createSettingsOvertimeSlice } from "@/store/slices/settingsOvertimeSlice";
import { createTaskSlice } from "@/store/slices/taskSlice";
import { createUiSlice } from "@/store/slices/uiSlice";
import { EffortumStore, StoreGet, StoreSet } from "@/store/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export { db };

export const storeCreator = (set: StoreSet, get: StoreGet): EffortumStore => ({
  ...createUiSlice(set, get),
  ...createSettingsOvertimeSlice(set, get),
  ...createProjectSlice(set, get),
  ...createTaskSlice(set, get),
  ...createCommentSlice(set, get),
  ...createLoadingMigrationSlice(set, get),
});

export const useEffortumStore = create<EffortumStore>()(
  process.env.NODE_ENV === "development"
    ? devtools(storeCreator)
    : storeCreator,
);
