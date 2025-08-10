import Dexie, { Table } from "dexie";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Project } from "./models/Project";
import { Task } from "./models/Task";

// FIXME move to own file, else it gets messed up with the version updates
class EffortumDB extends Dexie {
  tasks!: Table<Task>;
  projects!: Table<Project>;

  constructor() {
    super("EffortumDatabase");
    this.version(1).stores({
      tasks: "++id, date, timeStart, timeEnd, project",
      projects: "++id, &name",
    });

    //     db.version(2).stores({
    //   friends: '++id, firstName, lastName'
    // }).upgrade(tx => {
    //   return tx.friends.toCollection().modify(friend => {
    //     const [firstName, lastName] = friend.name.split(' ');
    //     friend.firstName = firstName;
    //     friend.lastName = lastName || '';
    //     delete friend.name;
    //   });
    // });
  }
}

const db = new EffortumDB();

interface EffortumStore {
  tasks: Task[];
  projects: Project[];

  loadFromIndexedDb: () => void;

  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;

  addProject: (project: Project) => void;
}

// FIXME the ids should only be generated here
export const storeCreator = (set, get) => ({
  projects: [],
  tasks: [],

  loadFromIndexedDb: async () => {
    const tasks = await db.tasks.orderBy("date").toArray();
    const projects = await db.projects.orderBy("name").toArray();
    set({ tasks, projects });
  },

  addTask: async (task) => {
    await db.tasks.add(task);
    const tasks = await db.tasks.toArray();
    set({ tasks });
  },

  updateTask: async (id, updates) => {
    await db.tasks.update(id, updates);
    const tasks = await db.tasks.toArray();
    set({ tasks });
  },

  addProject: async (project) => {
    await db.projects.add(project);
    const projects = await db.projects.toArray();
    set({ projects });
  },
});

export const useEffortumStore = create<EffortumStore>()(
  process.env.NODE_ENV === "development"
    ? devtools(storeCreator)
    : storeCreator,
);
