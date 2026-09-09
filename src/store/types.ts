import { Overtime } from "@/models/Overtime";
import { Project } from "@/models/Project";
import { Settings } from "@/models/Settings";
import { Task } from "@/models/Task";

export type TaskInput = Omit<Task, "projectId"> & {
  projectId?: string;
  projectName?: string;
};

export type TaskUpdateInput = Partial<Omit<Task, "projectId">> & {
  projectId?: string;
  projectName?: string;
};

export interface EffortumStore {
  tasks: Task[];
  projects: Project[];
  overtime: Overtime[];
  settings: Settings[];
  selectedDateRange: [string | null, string | null];
  endTimeOfLastStoppedTask: string | null;
  isDataLoading: boolean;

  loadFromIndexedDb: () => Promise<void>;
  backfillProjectRelationsIfMissing: () => Promise<void>;

  addTask: (task: TaskInput) => Promise<void>;
  updateTask: (id: string, updates: TaskUpdateInput) => Promise<void>;

  getCommentsForProject: (projectId: string) => string[];
  getUniqueTaskCommentsForProject: (projectId: string) => Promise<string[]>;
  getTaskCommentCountsForProject: (
    projectId: string,
  ) => Promise<Record<string, number>>;
  getTaskCommentHoursForProject: (
    projectId: string,
  ) => Promise<Record<string, number>>;
  renameTaskCommentForProject: (
    projectId: string,
    oldComment: string,
    newComment: string,
  ) => Promise<void>;

  addProject: (project: Project) => Promise<void>;
  updateProjectName: (id: string, name: string) => Promise<void>;

  setSelectedDateRange: (range: [string | null, string | null]) => void;

  setEndTimeOfLastStoppedTask: (time: string | null) => void;

  updateOvertime: (
    currentBalance: number,
    workingHoursPerDay: number,
  ) => Promise<void>;

  updateSettings: (roundToNearest5Minutes: boolean) => Promise<void>;

  getProjectBookedTimeHours: (projectId: string) => Promise<number>;
}

export interface StoreSet {
  (
    partial:
      | Partial<EffortumStore>
      | ((state: EffortumStore) => Partial<EffortumStore>),
  ): void;
}

export interface StoreGet {
  (): EffortumStore;
}
