import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { EffortumDB } from "./db";
import { Comment } from "./models/Comment";
import { Project } from "./models/Project";
import { Task } from "./models/Task";

export const db = new EffortumDB();

interface EffortumStore {
  tasks: Task[];
  projects: Project[];
  comments: Comment[];
  selectedDateRange: [string | null, string | null];
  endTimeOfLastStoppedTask: string | null;

  loadFromIndexedDb: () => void;

  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;

  addComment: (comment: Comment) => void;
  getCommentsForProject: (project: string) => Comment[];

  addProject: (project: Project) => void;

  setSelectedDateRange: (range: [string | null, string | null]) => void;

  setEndTimeOfLastStoppedTask: (time: string | null) => void;
}

interface StoreSet {
  (
    partial:
      | Partial<EffortumStore>
      | ((state: EffortumStore) => Partial<EffortumStore>),
  ): void;
}

interface StoreGet {
  (): EffortumStore;
}

export const storeCreator = (set: StoreSet, get: StoreGet): EffortumStore => ({
  projects: [],
  tasks: [],
  comments: [],
  selectedDateRange: [null, null] as [string | null, string | null],
  endTimeOfLastStoppedTask: null,

  // adjust this whenever a new entity is added to the db
  loadFromIndexedDb: async () => {
    const tasks = await db.tasks.orderBy("date").toArray();
    const projects = await db.projects.orderBy("name").toArray();
    const comments = await db.comments.orderBy("comment").toArray();
    set({ tasks, projects, comments });
  },

  addTask: async (task: Task) => {
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

  updateTask: async (id: string, updates: Partial<Task>) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) {
      console.error(`Task with id ${id} not found`);
      return;
    }
    let projectInstance: Project | undefined = get().projects.find(
      (p) => p.name === task.project,
    );

    if (!projectInstance) {
      projectInstance = { id: crypto.randomUUID(), name: task!.project };
      await db.projects.add(projectInstance);
      set({ projects: [...get().projects, projectInstance] });
    }

    // If there's a comment in the updates, add it to comments
    if (updates.comment) {
      await get().addComment({
        project: projectInstance.name,
        comment: updates.comment,
      });
    }

    await db.tasks.update(id, updates);
    const tasks = await db.tasks.toArray();
    set({ tasks });
  },

  addProject: async (project: Project) => {
    await db.projects.add(project);
    const projects = await db.projects.toArray();
    set({ projects });
  },

  addComment: async (comment: Comment) => {
    const isExisting = get().comments.some(
      (c: Comment) =>
        c.project === comment.project && c.comment === comment.comment,
    );

    if (!isExisting) {
      await db.comments.add(comment);
      const comments = await db.comments.toArray();
      set({ comments });
    }
  },

  getCommentsForProject: (project: string) => {
    return get().comments.filter((comment) => comment.project === project);
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
