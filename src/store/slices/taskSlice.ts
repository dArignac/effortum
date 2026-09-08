import { Project } from "@/models/Project";
import { Task } from "@/models/Task";
import { db } from "@/store/db";
import { StoreGet, StoreSet, TaskInput, TaskUpdateInput } from "@/store/types";
import dayjs from "dayjs";

export const createTaskSlice = (set: StoreSet, get: StoreGet) => ({
  tasks: [],

  /**
   * Calculates the total booked time in hours for a project.
   * @param projectId - The ID of the project
   * @returns Total hours (as a number) worked on this project
   */
  getProjectBookedTimeHours: async (projectId: string) => {
    const tasks = await db.tasks.toArray();

    const totalSeconds = tasks
      .filter((task) => task.projectId === projectId && task.timeEnd)
      .reduce((sum, task) => {
        const startTime = dayjs(`${task.date}T${task.timeStart}`);
        const endTime = dayjs(`${task.date}T${task.timeEnd}`);
        const diffInSeconds = endTime.diff(startTime, "second");

        return diffInSeconds > 0 ? sum + diffInSeconds : sum;
      }, 0);

    return totalSeconds / 3600;
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
});
