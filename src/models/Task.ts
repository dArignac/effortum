export type Task = {
  id: string;
  date: string; // ISO date string
  timeStart: string; // ISO time string
  timeEnd?: string; // ISO time string
  project: string;
  comment?: string;
};
