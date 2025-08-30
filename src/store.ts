import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { EffortumDB } from "./db";
import { Project } from "./models/Project";
import { Task } from "./models/Task";

const db = new EffortumDB();

interface EffortumStore {
  tasks: Task[];
  projects: Project[];
  selectedDateRange: [string | null, string | null];
  endTimeOfLastStoppedTask: string | null;

  loadFromIndexedDb: () => void;

  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;

  addProject: (project: Project) => void;

  setSelectedDateRange: (range: [string | null, string | null]) => void;

  setEndTimeOfLastStoppedTask: (time: string | null) => void;
}

export const storeCreator = (set, get) => ({
  projects: [],
  tasks: [],
  selectedDateRange: [null, null] as [string | null, string | null],
  endTimeOfLastStoppedTask: null,

  loadFromIndexedDb: async () => {
    const tasks = await db.tasks.orderBy("date").toArray();
    const projects = await db.projects.orderBy("name").toArray();
    set({ tasks, projects });
  },

  addTask: async (task) => {
    // create project if not already existing
    let projectInstance = get().projects.find((p) => p.name === task.project);
    if (!projectInstance) {
      projectInstance = { id: crypto.randomUUID(), name: task.project };
      await db.projects.add(projectInstance);
      set({ projects: [...get().projects, projectInstance] });
    }

    // add task to db
    await db.tasks.add(task);
    const tasks = await db.tasks.toArray();
    set({ tasks });
  },

  updateTask: async (id, updates) => {
    const task = get().tasks.find((t) => t.id === id);
    let projectInstance = get().projects.find((p) => p.name === task.project);
    if (!projectInstance) {
      projectInstance = { id: crypto.randomUUID(), name: task.project };
      await db.projects.add(projectInstance);
      set({ projects: [...get().projects, projectInstance] });
    }

    await db.tasks.update(id, updates);
    const tasks = await db.tasks.toArray();
    set({ tasks });
  },

  addProject: async (project) => {
    await db.projects.add(project);
    const projects = await db.projects.toArray();
    set({ projects });
  },

  setSelectedDateRange: (range: [string | null, string | null]) => {
    set({ selectedDateRange: range });
  },

  setEndTimeOfLastStoppedTask: (time: string | null) => {
    set({ endTimeOfLastStoppedTask: time });
  },
});

export const useEffortumStore = create<EffortumStore>()(
  process.env.NODE_ENV === "development"
    ? devtools(storeCreator)
    : storeCreator,
);
