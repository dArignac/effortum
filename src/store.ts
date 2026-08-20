import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { EffortumDB } from "./db";
import { Comment } from "./models/Comment";
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

type CommentInput = Omit<Comment, "projectId"> & {
  projectId?: string;
  projectName?: string;
};

interface EffortumStore {
  tasks: Task[];
  projects: Project[];
  comments: Comment[];
  overtime: Overtime[];
  settings: Settings[];
  selectedDateRange: [string | null, string | null];
  endTimeOfLastStoppedTask: string | null;

  loadFromIndexedDb: () => Promise<void>;
  backfillProjectRelationsIfMissing: () => Promise<void>;

  addTask: (task: TaskInput) => Promise<void>;
  updateTask: (id: string, updates: TaskUpdateInput) => Promise<void>;

  addComment: (comment: CommentInput) => Promise<void>;
  getCommentsForProject: (projectId: string) => Comment[];

  addProject: (project: Project) => Promise<void>;

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
  comments: [],
  overtime: [],
  settings: [],
  selectedDateRange: [null, null] as [string | null, string | null],
  endTimeOfLastStoppedTask: null,

  backfillProjectRelationsIfMissing: async () => {
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

    const comments = await db.comments.toArray();
    for (const comment of comments) {
      if (comment.projectId) {
        continue;
      }

      const project =
        (await resolveProject(comment.project)) ??
        (await resolveProject("Migrated Project"));
      if (!project) {
        continue;
      }

      await db.comments.update(comment.id, {
        projectId: project.id,
        project: comment.project || project.name,
      });
    }
  },

  // adjust this whenever a new entity is added to the db
  loadFromIndexedDb: async () => {
    await get().backfillProjectRelationsIfMissing();
    const tasks = await db.tasks.orderBy("date").toArray();
    const projects = await db.projects.orderBy("name").toArray();
    const comments = await db.comments.orderBy("comment").toArray();
    const overtime = await db.overtime.toArray();
    const settings = await db.settings.toArray();
    set({ tasks, projects, comments, overtime, settings });
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

    // If there's a comment in the updates, add it to comments
    if (updates.comment) {
      await get().addComment({
        projectId: projectInstance.id,
        project: projectInstance.name,
        comment: updates.comment,
      });
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

  addComment: async (comment: CommentInput) => {
    const normalizedProjectName = (
      comment.projectName ??
      comment.project ??
      ""
    ).trim();

    let projectInstance: Project | undefined = get().projects.find(
      (project) => project.id === comment.projectId,
    );
    if (!projectInstance && normalizedProjectName) {
      projectInstance = get().projects.find(
        (project) => project.name === normalizedProjectName,
      );
    }

    if (!projectInstance) {
      if (!normalizedProjectName) {
        return;
      }

      projectInstance = {
        id: comment.projectId || crypto.randomUUID(),
        name: normalizedProjectName,
      };
      await db.projects.add(projectInstance);
      set({ projects: [...get().projects, projectInstance] });
    }

    const isExisting = get().comments.some(
      (c: Comment) =>
        c.projectId === projectInstance.id && c.comment === comment.comment,
    );

    if (!isExisting) {
      await db.comments.add({
        id: comment.id,
        projectId: projectInstance.id,
        project: projectInstance.name,
        comment: comment.comment,
      });
      const comments = await db.comments.toArray();
      set({ comments });
    }
  },

  getCommentsForProject: (projectId: string) => {
    return get().comments.filter((comment) => comment.projectId === projectId);
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
