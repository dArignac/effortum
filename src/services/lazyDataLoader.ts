import { db } from "@/store";
import { Task } from "@/models/Task";
import { Project } from "@/models/Project";
import { Overtime } from "@/models/Overtime";
import { Settings } from "@/models/Settings";

/**
 * Service for lazy loading data based on date ranges
 */
export class LazyDataLoader {
  /**
   * Load tasks for a specific date range
   */
  static async loadTasksForDateRange(startDate: string, endDate: string): Promise<Task[]> {
    try {
      // Query tasks within the specified date range
      const tasks = await db.tasks
        .where('date')
        .between(startDate, endDate, true, true)
        .toArray();

      return tasks;
    } catch (error) {
      console.error("Error loading tasks for date range:", error);
      throw new Error("Failed to load tasks");
    }
  }

  /**
   * Load all projects (this is typically loaded once at app start)
   */
  static async loadProjects(): Promise<Project[]> {
    try {
      const projects = await db.projects.orderBy('name').toArray();
      return projects;
    } catch (error) {
      console.error("Error loading projects:", error);
      throw new Error("Failed to load projects");
    }
  }

  /**
   * Load overtime data
   */
  static async loadOvertime(): Promise<Overtime[]> {
    try {
      const overtime = await db.overtime.toArray();
      return overtime;
    } catch (error) {
      console.error("Error loading overtime:", error);
      throw new Error("Failed to load overtime data");
    }
  }

  /**
   * Load settings
   */
  static async loadSettings(): Promise<Settings[]> {
    try {
      const settings = await db.settings.toArray();
      return settings;
    } catch (error) {
      console.error("Error loading settings:", error);
      throw new Error("Failed to load settings");
    }
  }

  /**
   * Load comments for a specific project
   */
  static async loadCommentsForProject(projectId: string): Promise<string[]> {
    try {
      // Get all tasks for this project and extract unique comments
      const tasks = await db.tasks
        .where('projectId')
        .equals(projectId)
        .toArray();

      const comments = tasks
        .map(task => (task.comment ?? "").trim())
        .filter(comment => comment.length > 0);

      // Return unique comments, sorted alphabetically
      return Array.from(new Set(comments)).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      );
    } catch (error) {
      console.error("Error loading comments for project:", error);
      throw new Error("Failed to load comments");
    }
  }

  /**
   * Load all data for a specific date range
   */
  static async loadDataForDateRange(startDate: string, endDate: string): Promise<{
    tasks: Task[];
    projects: Project[];
    overtime: Overtime[];
    settings: Settings[];
  }> {
    try {
      const [tasks, projects, overtime, settings] = await Promise.all([
        this.loadTasksForDateRange(startDate, endDate),
        this.loadProjects(),
        this.loadOvertime(),
        this.loadSettings()
      ]);

      return { tasks, projects, overtime, settings };
    } catch (error) {
      console.error("Error loading data for date range:", error);
      throw new Error("Failed to load data for date range");
    }
  }

  /**
   * Load all data at app startup (initial load)
   */
  static async loadInitialData(): Promise<{
    tasks: Task[];
    projects: Project[];
    overtime: Overtime[];
    settings: Settings[];
  }> {
    try {
      // For initial load, we should get the tasks for today only
      const today = new Date().toISOString().split('T')[0];

      const [tasks, projects, overtime, settings] = await Promise.all([
        this.loadTasksForDateRange(today, today),
        this.loadProjects(),
        this.loadOvertime(),
        this.loadSettings()
      ]);

      return { tasks, projects, overtime, settings };
    } catch (error) {
      console.error("Error loading initial data:", error);
      throw new Error("Failed to load initial data");
    }
  }
}