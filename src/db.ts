import Dexie, { Table } from "dexie";
import { Comment } from "./models/Comment";
import { Project } from "./models/Project";
import { Task } from "./models/Task";

export class EffortumDB extends Dexie {
  tasks!: Table<Task>;
  projects!: Table<Project>;
  comments!: Table<Comment>;

  constructor() {
    super("EffortumDatabase");
    this.version(1).stores({
      tasks: "++id, date, timeStart, timeEnd, project",
      projects: "++id, &name",
    });
    this.version(2).stores({
      comments: "++id, project, comment",
    });
  }
}
