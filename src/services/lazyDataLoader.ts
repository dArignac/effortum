import { Task } from "@/models/Task";
import { db } from "@/store";
import { isRunningTask } from "@/utils/time";

/**
 * Service for lazy loading data based on date ranges
 */
export class LazyDataLoader {
  /**
   * Load tasks for a specific date range, including any active running tasks
   */
  static async loadTasksForDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Task[]> {
    try {
      const tasks = await db.tasks
        .where("date")
        .between(startDate, endDate, true, true)
        .toArray();

      const activeTasks = await db.tasks.filter(isRunningTask).toArray();
      const existingTaskIds = new Set(tasks.map((task) => task.id));

      for (const activeTask of activeTasks) {
        if (!existingTaskIds.has(activeTask.id)) {
          tasks.push(activeTask);
        }
      }

      return tasks;
    } catch (error) {
      console.error("Error loading tasks for date range:", error);
      throw new Error("Failed to load tasks");
    }
  }
}
