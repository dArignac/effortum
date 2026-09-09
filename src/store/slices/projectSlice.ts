import { Project } from "@/models/Project";
import { db } from "@/store/db";
import { DeleteProjectOptions, StoreGet, StoreSet } from "@/store/types";

export const createProjectSlice = (set: StoreSet, get: StoreGet) => ({
  projects: [],

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
   * Returns the count of tasks associated with a project.
   */
  getProjectTaskCount: async (projectId: string) => {
    return await db.tasks.where("projectId").equals(projectId).count();
  },

  /**
   * Deletes a project. If it has tasks, requires options to either delete tasks or move them.
   */
  deleteProject: async (id: string, options?: DeleteProjectOptions) => {
    const existingProject = get().projects.find((project) => project.id === id);
    if (!existingProject) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    const taskCount = await db.tasks.where("projectId").equals(id).count();
    if (taskCount > 0 && !options) {
      throw new Error("PROJECT_HAS_TASKS");
    }

    if (options?.taskAction === "move") {
      if (!options.destinationProjectId) {
        throw new Error("DESTINATION_PROJECT_REQUIRED");
      }
      if (options.destinationProjectId === id) {
        throw new Error("CANNOT_MOVE_TO_SAME_PROJECT");
      }
      const destinationProject = get().projects.find(
        (project) => project.id === options.destinationProjectId,
      );
      if (!destinationProject) {
        throw new Error("DESTINATION_PROJECT_NOT_FOUND");
      }

      await db.transaction("rw", db.projects, db.tasks, async () => {
        const tasksToMove = await db.tasks
          .where("projectId")
          .equals(id)
          .toArray();

        for (const task of tasksToMove) {
          await db.tasks.update(task.id, {
            projectId: destinationProject.id,
            project: destinationProject.name,
          });
        }

        await db.projects.delete(id);
      });
    } else if (options?.taskAction === "delete") {
      await db.transaction("rw", db.projects, db.tasks, async () => {
        await db.tasks.where("projectId").equals(id).delete();
        await db.projects.delete(id);
      });
    } else {
      await db.projects.delete(id);
    }

    const [projects, tasks] = await Promise.all([
      db.projects.toArray(),
      db.tasks.toArray(),
    ]);
    set({ projects, tasks });
  },
});
