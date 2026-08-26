import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { EffortumDB } from "./db";
import { Overtime } from "./models/Overtime";
import { Project } from "./models/Project";
import { Settings } from "./models/Settings";
import { Task } from "./models/Task";

export const db = new EffortumDB();

type TaskInput = Omit<Task, "projectId"> & {
  projectId?: string;
  projectName?: string;
};

type TaskUpdateInput = Partial<Omit<Task, "projectId">> & {
  projectId?: string;
  projectName?: string;
};

interface EffortumStore {
  tasks: Task[];
  projects: Project[];
  overtime: Overtime[];
  settings: Settings[];
  selectedDateRange: [string | null, string | null];
  endTimeOfLastStoppedTask: string | null;

  loadFromIndexedDb: () => Promise<void>;
  backfillProjectRelationsIfMissing: () => Promise<void>;

  addTask: (task: TaskInput) => Promise<void>;
  updateTask: (id: string, updates: TaskUpdateInput) => Promise<void>;

  getCommentsForProject: (projectId: string) => string[];

  addProject: (project: Project) => Promise<void>;
  updateProjectName: (id: string, name: string) => Promise<void>;

  setSelectedDateRange: (range: [string | null, string | null]) => void;

  setEndTimeOfLastStoppedTask: (time: string | null) => void;

  updateOvertime: (
    currentBalance: number,
    workingHoursPerDay: number,
  ) => Promise<void>;

  updateSettings: (roundToNearest5Minutes: boolean) => Promise<void>;
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
  overtime: [],
  settings: [],
  selectedDateRange: [null, null] as [string | null, string | null],
  endTimeOfLastStoppedTask: null,

  backfillProjectRelationsIfMissing: async () => {
    // This is called by loadFromIndexedDb only when there are tasks without project IDs
    // Optimization: Check if we need to do any backfill at all
    const projects = await db.projects.toArray();

    const nameToId = new Map(
      projects.map((project) => [project.name, project.id]),
    );

    const resolveProject = async (
      projectName?: string,
      projectId?: string,
    ): Promise<Project | null> => {
      const projectsInState = get().projects;

      if (projectId) {
        const projectFromState = projectsInState.find(
          (p) => p.id === projectId,
        );
        if (projectFromState) {
          return projectFromState;
        }

        const projectFromDb = await db.projects.get(projectId);
        if (projectFromDb) {
          return projectFromDb;
        }
      }

      const normalizedName = (projectName ?? "").trim();
      if (!normalizedName) {
        return null;
      }

      const existingFromState = projectsInState.find(
        (p) => p.name === normalizedName,
      );
      if (existingFromState) {
        return existingFromState;
      }

      const existingId = nameToId.get(normalizedName);
      if (existingId) {
        return { id: existingId, name: normalizedName };
      }

      const createdProject = { id: crypto.randomUUID(), name: normalizedName };
      await db.projects.add(createdProject);
      nameToId.set(createdProject.name, createdProject.id);
      set({ projects: [...get().projects, createdProject] });
      return createdProject;
    };

    const tasks = await db.tasks.toArray();
    for (const task of tasks) {
      if (task.projectId) {
        continue;
      }

      const project =
        (await resolveProject(task.project)) ??
        (await resolveProject("Migrated Project"));
      if (!project) {
        continue;
      }

      await db.tasks.update(task.id, {
        projectId: project.id,
        project: task.project || project.name,
      });
    }
  },

  // adjust this whenever a new entity is added to the db
  loadFromIndexedDb: async () => {
    // Only run backfill if needed (optimization)
    const hasProjectIds = await db.tasks
      .limit(1)
      .toArray()
      .then((tasks) =>
        tasks.some(
          (task) => task.projectId !== undefined && task.projectId !== null,
        ),
      );

    if (!hasProjectIds) {
      await get().backfillProjectRelationsIfMissing();
    }

    const [tasks, projects, overtime, settings] = await Promise.all([
      db.tasks.orderBy("date").toArray(),
      db.projects.orderBy("name").toArray(),
      db.overtime.toArray(),
      db.settings.toArray(),
    ]);
    set({ tasks, projects, overtime, settings });
  },

  addTask: async (task: TaskInput) => {
    const normalizedProjectName = (
      task.projectName ??
      task.project ??
      ""
    ).trim();
    if (!normalizedProjectName) {
      return;
    }

    let projectInstance = get().projects.find(
      (project) => project.id === task.projectId,
    );
    if (!projectInstance) {
      projectInstance = get().projects.find(
        (project) => project.name === normalizedProjectName,
      );
    }

    if (!projectInstance) {
      projectInstance = {
        id: task.projectId || crypto.randomUUID(),
        name: normalizedProjectName,
      };
      await db.projects.add(projectInstance);
      set({ projects: [...get().projects, projectInstance] });
    }

    await db.tasks.add({
      id: task.id,
      date: task.date,
      timeStart: task.timeStart,
      timeEnd: task.timeEnd,
      projectId: projectInstance.id,
      project: projectInstance.name,
      comment: task.comment,
    });

    const tasks = await db.tasks.toArray();
    set({ tasks });
  },

  updateTask: async (id: string, updates: TaskUpdateInput) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) {
      console.error(`Task with id ${id} not found`);
      return;
    }

    const normalizedProjectName = (
      updates.projectName ??
      updates.project ??
      task.project ??
      ""
    ).trim();

    let projectInstance: Project | undefined = get().projects.find(
      (project) => project.id === updates.projectId,
    );
    if (!projectInstance && normalizedProjectName) {
      projectInstance = get().projects.find(
        (project) => project.name === normalizedProjectName,
      );
    }
    if (!projectInstance) {
      projectInstance = {
        id: updates.projectId || crypto.randomUUID(),
        name: normalizedProjectName,
      };
      await db.projects.add(projectInstance);
      set({ projects: [...get().projects, projectInstance] });
    }

    const taskUpdates: Partial<Task> = {
      projectId: projectInstance.id,
      project: projectInstance.name,
    };

    if (updates.date !== undefined) {
      taskUpdates.date = updates.date;
    }
    if (updates.timeStart !== undefined) {
      taskUpdates.timeStart = updates.timeStart;
    }
    if (updates.timeEnd !== undefined) {
      taskUpdates.timeEnd = updates.timeEnd;
    }
    if (updates.comment !== undefined) {
      taskUpdates.comment = updates.comment;
    }

    await db.tasks.update(id, taskUpdates);
    const tasks = await db.tasks.toArray();
    set({ tasks });
  },

  addProject: async (project: Project) => {
    await db.projects.add(project);
    const projects = await db.projects.toArray();
    set({ projects });
  },

  /**
   * Renames a project and keeps denormalized task project names in sync.
   */
  updateProjectName: async (id: string, name: string) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new Error("PROJECT_NAME_REQUIRED");
    }

    const existingProject = get().projects.find((project) => project.id === id);
    if (!existingProject) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    if (existingProject.name === normalizedName) {
      return;
    }

    try {
      await db.transaction("rw", db.projects, db.tasks, async () => {
        await db.projects.update(id, { name: normalizedName });
      });
    } catch (error) {
      const errorName =
        typeof error === "object" && error !== null && "name" in error
          ? String(error.name)
          : "";
      const errorMessage =
        error instanceof Error ? error.message : String(error ?? "");

      if (errorName === "ConstraintError" || /constraint/i.test(errorMessage)) {
        throw new Error("PROJECT_NAME_ALREADY_EXISTS");
      }

      throw error;
    }

    const [projects, tasks] = await Promise.all([
      db.projects.toArray(),
      db.tasks.toArray(),
    ]);
    set({ projects, tasks });
  },

  /**
   * Returns distinct, non-empty task comments for a project to feed autocomplete.
   */
  getCommentsForProject: (projectId: string) => {
    const comments = get()
      .tasks.filter((task) => task.projectId === projectId)
      .map((task) => (task.comment ?? "").trim())
      .filter((comment) => comment.length > 0);

    return Array.from(new Set(comments)).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  },

  setSelectedDateRange: (range: [string | null, string | null]) => {
    set({ selectedDateRange: range });
  },

  setEndTimeOfLastStoppedTask: (time: string | null) => {
    set({ endTimeOfLastStoppedTask: time });
  },

  updateOvertime: async (
    currentBalance: number,
    workingHoursPerDay: number,
  ) => {
    const overtimeValue = {
      id: "overtime-default",
      currentBalance,
      workingHoursPerDay,
    };

    db.overtime.put(overtimeValue);

    set({
      overtime: [overtimeValue],
    });
  },

  updateSettings: async (roundToNearest5Minutes: boolean) => {
    const settingsValue = {
      id: "settings-default",
      roundToNearest5Minutes,
    };

    db.settings.put(settingsValue);

    set({
      settings: [settingsValue],
    });
  },
});

export const useEffortumStore = create<EffortumStore>()(
  process.env.NODE_ENV === "development"
    ? devtools(storeCreator)
    : storeCreator,
);
