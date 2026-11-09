import { Project } from "@/models/Project";
import { Task } from "@/models/Task";
import { db } from "@/store/db";
import { StoreGet, StoreSet, TaskInput, TaskUpdateInput } from "@/store/types";
import { isRunningTask } from "../../utils/time";
import {
  sortCommentsByLastUsed,
  sortProjectsByLastUsed,
} from "../../utils/usageSort";
import dayjs from "dayjs";

async function ensureNoOtherActiveTask(
  get: StoreGet,
  excludeTaskId?: string,
): Promise<void> {
  const isOtherActive = (task: Task) =>
    (excludeTaskId === undefined || task.id !== excludeTaskId) &&
    isRunningTask(task);

  let existingActiveTask = get().tasks.find(isOtherActive);
  if (!existingActiveTask && typeof db.tasks?.filter === "function") {
    existingActiveTask = await db.tasks.filter(isOtherActive).first();
  }
  if (existingActiveTask) {
    throw new Error(
      "Only one active task is allowed. Please stop the running task first.",
    );
  }
}

function findExistingProject(
  projects: ReadonlyArray<Project>,
  projectId: string | undefined,
  normalizedProjectName: string,
): Project | undefined {
  const existingById = projects.find((project) => project.id === projectId);
  if (existingById) {
    return existingById;
  }
  if (normalizedProjectName) {
    return projects.find((project) => project.name === normalizedProjectName);
  }
  return undefined;
}

export const createTaskSlice = (set: StoreSet, get: StoreGet) => ({
  tasks: [],

  getRecentProjectNames: async () => {
    const tasks = await db.tasks.toArray();
    return sortProjectsByLastUsed(get().projects, tasks);
  },

  getRecentTaskCommentsForProject: async (projectId: string) => {
    if (!projectId) {
      return [];
    }
    const tasks = await db.tasks.where("projectId").equals(projectId).toArray();
    return sortCommentsByLastUsed(tasks);
  },

  /**
   * Calculates the total booked time in hours for a project.
   * @param projectId - The ID of the project
   * @returns Total hours (as a number) worked on this project
   */
  getProjectBookedTimeHours: async (projectId: string) => {
    const tasks = await db.tasks.where("projectId").equals(projectId).toArray();

    let totalSeconds = 0;
    for (const task of tasks) {
      if (!task.timeEnd) {
        continue;
      }
      const startTime = dayjs(`${task.date}T${task.timeStart}`);
      const endTime = dayjs(`${task.date}T${task.timeEnd}`);
      const diffInSeconds = endTime.diff(startTime, "second");
      if (diffInSeconds > 0) {
        totalSeconds += diffInSeconds;
      }
    }

    return totalSeconds / 3600;
  },

  addTask: async (task: TaskInput) => {
    if (isRunningTask(task)) {
      await ensureNoOtherActiveTask(get);
    }

    const normalizedProjectName = (
      task.projectName ??
      task.project ??
      ""
    ).trim();
    if (!normalizedProjectName) {
      return;
    }

    let projectInstance = findExistingProject(
      get().projects,
      task.projectId,
      normalizedProjectName,
    );
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
      timeEnd: task.timeEnd ?? "",
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

    if (updates.timeEnd !== undefined && updates.timeEnd.trim().length === 0) {
      await ensureNoOtherActiveTask(get, id);
    }

    const normalizedProjectName = (
      updates.projectName ??
      updates.project ??
      task.project ??
      ""
    ).trim();

    let projectInstance = findExistingProject(
      get().projects,
      updates.projectId,
      normalizedProjectName,
    );
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
});
