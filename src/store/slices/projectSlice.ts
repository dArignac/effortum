import { Project } from "@/models/Project";
import { db } from "@/store/db";
import { StoreGet, StoreSet } from "@/store/types";

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
});
