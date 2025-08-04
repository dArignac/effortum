import { create } from "zustand";
import { Task } from "./models/Task";
import { devtools, persist } from "zustand/middleware";

interface EffortumState {
  tasks: Task[];
  projects: string[];
  addTask: (task: Task) => void;
  addProject: (project: string) => void;
}

// FIXME sorting?
export const useStore = create<EffortumState>((set) => ({
  projects: [],
  tasks: [],
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
}));
