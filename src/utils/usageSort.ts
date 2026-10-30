import { Project } from "@/models/Project";
import { Task } from "@/models/Task";
import dayjs from "dayjs";

export type TaskUsageTimestamp = {
  startMs: number;
  endMs: number;
};

type TaskTiming = Pick<Task, "date" | "timeStart" | "timeEnd">;
type TaskForProjectSort = TaskTiming & {
  projectId?: string;
  project?: string;
};
type TaskForCommentSort = TaskTiming & Pick<Task, "comment">;

export function getTaskUsageTimestamp(task: TaskTiming): TaskUsageTimestamp {
  const startParsed = dayjs(`${task.date.trim()}T${task.timeStart.trim()}`);
  const startMs = startParsed.isValid() ? startParsed.valueOf() : 0;

  const trimmedEnd = task.timeEnd?.trim() ?? "";
  if (trimmedEnd.length === 0) {
    return {
      startMs,
      endMs: Number.MAX_SAFE_INTEGER,
    };
  }

  const endParsed = dayjs(`${task.date.trim()}T${trimmedEnd}`);
  const endMs = endParsed.isValid() ? endParsed.valueOf() : startMs;

  return { startMs, endMs };
}

function compareTimestampsDesc(
  a: TaskUsageTimestamp,
  b: TaskUsageTimestamp,
): number {
  if (a.startMs !== b.startMs) {
    return a.startMs > b.startMs ? -1 : 1;
  }
  if (a.endMs !== b.endMs) {
    return a.endMs > b.endMs ? -1 : 1;
  }
  return 0;
}

function compareAlphabetically(a: string, b: string): number {
  const baseComparison = a.localeCompare(b, undefined, { sensitivity: "base" });
  return baseComparison !== 0 ? baseComparison : a.localeCompare(b);
}

export function sortProjectsByLastUsed(
  projects: ReadonlyArray<Project>,
  tasks: ReadonlyArray<TaskForProjectSort>,
): string[] {
  const projectIds = new Set(projects.map((project) => project.id));
  const projectNameToId = new Map(
    projects.map((project) => [project.name, project.id]),
  );
  const latestUsageByProjectId = new Map<string, TaskUsageTimestamp>();

  for (const task of tasks) {
    const rawProjectId = task.projectId?.trim();
    const matchedProjectId = rawProjectId
      ? projectIds.has(rawProjectId)
        ? rawProjectId
        : undefined
      : projectNameToId.get((task.project ?? "").trim());

    if (!matchedProjectId) {
      continue;
    }

    const timestamp = getTaskUsageTimestamp(task);
    const currentLatest = latestUsageByProjectId.get(matchedProjectId);
    if (!currentLatest || compareTimestampsDesc(timestamp, currentLatest) < 0) {
      latestUsageByProjectId.set(matchedProjectId, timestamp);
    }
  }

  return [...projects]
    .sort((a, b) => {
      const aUsage = latestUsageByProjectId.get(a.id);
      const bUsage = latestUsageByProjectId.get(b.id);

      if (aUsage && bUsage) {
        const usageComparison = compareTimestampsDesc(aUsage, bUsage);
        if (usageComparison !== 0) {
          return usageComparison;
        }
        return compareAlphabetically(a.name, b.name);
      }

      if (aUsage) {
        return -1;
      }
      if (bUsage) {
        return 1;
      }

      return compareAlphabetically(a.name, b.name);
    })
    .map((project) => project.name);
}

export function sortCommentsByLastUsed(
  tasks: ReadonlyArray<TaskForCommentSort>,
): string[] {
  const latestUsageByComment = new Map<string, TaskUsageTimestamp>();

  for (const task of tasks) {
    const trimmedComment = (task.comment ?? "").trim();
    if (!trimmedComment) {
      continue;
    }

    const timestamp = getTaskUsageTimestamp(task);
    const currentLatest = latestUsageByComment.get(trimmedComment);
    if (!currentLatest || compareTimestampsDesc(timestamp, currentLatest) < 0) {
      latestUsageByComment.set(trimmedComment, timestamp);
    }
  }

  return Array.from(latestUsageByComment.entries())
    .sort(([commentA, usageA], [commentB, usageB]) => {
      const usageComparison = compareTimestampsDesc(usageA, usageB);
      if (usageComparison !== 0) {
        return usageComparison;
      }
      return compareAlphabetically(commentA, commentB);
    })
    .map(([comment]) => comment);
}
