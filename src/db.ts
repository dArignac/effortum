import Dexie, { Table } from "dexie";
import { Project } from "./models/Project";
import { Task } from "./models/Task";

export class EffortumDB extends Dexie {
  tasks!: Table<Task>;
  projects!: Table<Project>;

  constructor() {
    super("EffortumDatabase");
    this.version(1).stores({
      tasks: "++id, date, timeStart, timeEnd, project",
      projects: "++id, &name",
    });

    //     db.version(2).stores({
    //   friends: '++id, firstName, lastName'
    // }).upgrade(tx => {
    //   return tx.friends.toCollection().modify(friend => {
    //     const [firstName, lastName] = friend.name.split(' ');
    //     friend.firstName = firstName;
    //     friend.lastName = lastName || '';
    //     delete friend.name;
    //   });
    // });
  }
}
