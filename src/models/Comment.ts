export type Comment = {
  id?: string;
  projectId: string;
  project?: string; // legacy compatibility during migration rollout
  comment: string;
};
