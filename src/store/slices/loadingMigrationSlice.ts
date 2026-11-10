import { db } from "@/store/db";
import { StoreGet, StoreSet } from "@/store/types";
import { isRunningTask } from "../../utils/time";
import dayjs from "dayjs";

export const createLoadingMigrationSlice = (set: StoreSet, get: StoreGet) => ({
  backfillProjectRelationsIfMissing: async () => {
    // This is called by loadFromIndexedDb only when there are tasks without project IDs
    const projects = await db.projects.toArray();

    const nameToId = new Map(
      projects.map((project) => [project.name, project.id]),
    );

    const resolveProject = async (projectName?: string) => {
      const normalizedName = (projectName ?? "").trim();
      if (!normalizedName) {
        return null;
      }

      const existingFromState = get().projects.find(
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
      const today = dayjs().format("YYYY-MM-DD");
      const [todayTasks, projects, overtime, settings, budgets] =
        await Promise.all([
          db.tasks.where("date").between(today, today, true, true).toArray(),
          db.projects.orderBy("name").toArray(),
          db.overtime.toArray(),
          db.settings.toArray(),
          db.budgets ? db.budgets.toArray() : Promise.resolve(undefined),
        ]);

      // Query any active running tasks (unclosed tasks with no timeEnd)
      const activeTasks = await db.tasks.filter(isRunningTask).toArray();

      const tasks = [...todayTasks];
      const existingTaskIds = new Set(tasks.map((task) => task.id));
      for (const activeTask of activeTasks) {
        if (!existingTaskIds.has(activeTask.id)) {
          tasks.push(activeTask);
        }
      }

      set({
        tasks,
        projects,
        overtime,
        settings,
        ...(budgets !== undefined ? { budgets } : {}),
      });
    } finally {
      set({ isDataLoading: false });
    }
  },
});
