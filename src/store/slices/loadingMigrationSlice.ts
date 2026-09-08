import { db } from "@/store/db";
import { StoreGet, StoreSet } from "@/store/types";

export const createLoadingMigrationSlice = (set: StoreSet, get: StoreGet) => ({
  backfillProjectRelationsIfMissing: async () => {
    // This is called by loadFromIndexedDb only when there are tasks without project IDs
    // Optimization: Check if we need to do any backfill at all
    const projects = await db.projects.toArray();

    const nameToId = new Map(
      projects.map((project) => [project.name, project.id]),
    );

    const resolveProject = async (projectName?: string, projectId?: string) => {
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
    set({ isDataLoading: true });

    try {
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

      // Load only initial data for today's date
      const today = new Date().toISOString().split("T")[0];
      const [tasks, projects, overtime, settings] = await Promise.all([
        db.tasks.where("date").between(today, today, true, true).toArray(),
        db.projects.orderBy("name").toArray(),
        db.overtime.toArray(),
        db.settings.toArray(),
      ]);

      set({
        tasks,
        projects,
        overtime,
        settings,
      });
    } finally {
      set({ isDataLoading: false });
    }
  },
});
