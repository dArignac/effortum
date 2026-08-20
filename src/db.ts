import Dexie, { Table, Transaction } from "dexie";
import { Comment } from "./models/Comment";
import { Overtime } from "./models/Overtime";
import { Project } from "./models/Project";
import { Settings } from "./models/Settings";
import { Task } from "./models/Task";

export class EffortumDB extends Dexie {
  tasks!: Table<Task>;
  projects!: Table<Project>;
  comments!: Table<Comment>;
  overtime!: Table<Overtime>;
  settings!: Table<Settings>;

  private async backfillProjectRelations(tx: Transaction) {
    const projectsTable = tx.table("projects");
    const tasksTable = tx.table("tasks");
    const commentsTable = tx.table("comments");

    const projects = (await projectsTable.toArray()) as Project[];
    const projectNameToId = new Map(
      projects.map((project) => [project.name, project.id]),
    );

    const resolveProject = async (
      projectName?: string,
    ): Promise<Project | null> => {
      const normalizedName = (projectName ?? "").trim();
      if (!normalizedName) {
        return null;
      }

      const existingId = projectNameToId.get(normalizedName);
      if (existingId) {
        return { id: existingId, name: normalizedName };
      }

      const project = { id: crypto.randomUUID(), name: normalizedName };
      await projectsTable.add(project);
      projectNameToId.set(project.name, project.id);
      return project;
    };

    const tasks = (await tasksTable.toArray()) as Array<
      Task & { project?: string }
    >;
    for (const task of tasks) {
      const project =
        (await resolveProject(task.project)) ??
        (await resolveProject("Migrated Project"));

      if (!project) {
        continue;
      }

      await tasksTable.update(task.id, {
        projectId: task.projectId || project.id,
        project: task.project || project.name,
      });
    }

    const comments = (await commentsTable.toArray()) as Array<
      Comment & { project?: string }
    >;
    for (const comment of comments) {
      const project =
        (await resolveProject(comment.project)) ??
        (await resolveProject("Migrated Project"));

      if (!project) {
        continue;
      }

      await commentsTable.update(comment.id, {
        projectId: comment.projectId || project.id,
        project: comment.project || project.name,
      });
    }
  }

  constructor() {
    super("EffortumDatabase");
    this.version(1).stores({
      tasks: "++id, date, timeStart, timeEnd, project",
      projects: "++id, &name",
    });
    this.version(2).stores({
      tasks: "++id, date, timeStart, timeEnd, project",
      projects: "++id, &name",
      comments: "++id, project, comment",
    });
    this.version(3).stores({
      tasks: "++id, date, timeStart, timeEnd, project",
      projects: "++id, &name",
      comments: "++id, project, comment",
      overtime: "&id, currentBalance, workingHoursPerDay",
    });
    this.version(4).stores({
      tasks: "++id, date, timeStart, timeEnd, project",
      projects: "++id, &name",
      comments: "++id, project, comment",
      overtime: "&id, currentBalance, workingHoursPerDay",
      settings: "&id, roundToNearest5Minutes",
    });
    this.version(5)
      .stores({
        tasks: "++id, date, timeStart, timeEnd, projectId, project",
        projects: "++id, &name",
        comments: "++id, projectId, project, comment",
        overtime: "&id, currentBalance, workingHoursPerDay",
        settings: "&id, roundToNearest5Minutes",
      })
      .upgrade((tx) => this.backfillProjectRelations(tx));

    this.version(6)
      .stores({
        tasks: "++id, date, timeStart, timeEnd, projectId, project",
        projects: "++id, &name",
        comments: "++id, projectId, project, comment",
        overtime: "&id, currentBalance, workingHoursPerDay",
        settings: "&id, roundToNearest5Minutes",
      })
      .upgrade((tx) => this.backfillProjectRelations(tx));
  }
}
