export type Task = {
  id: string;
  date: string; // ISO date string
  timeStart: string; // ISO time string
  timeEnd?: string; // ISO time string
  projectId: string;
  project?: string; // legacy compatibility during migration rollout
  comment?: string; // persisted task comment used for per-project autocomplete suggestions
};
