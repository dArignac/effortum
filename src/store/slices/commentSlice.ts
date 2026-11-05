import { db } from "@/store/db";
import { StoreGet, StoreSet } from "@/store/types";
import dayjs from "dayjs";

function extractUniqueSortedComments(
  tasks: ReadonlyArray<{ comment?: string }>,
): string[] {
  const comments = new Set<string>();
  for (const task of tasks) {
    const trimmed = (task.comment ?? "").trim();
    if (trimmed.length > 0) {
      comments.add(trimmed);
    }
  }
  return Array.from(comments).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

export const createCommentSlice = (set: StoreSet, get: StoreGet) => ({
  /**
   * Returns distinct, non-empty task comments for a project to feed autocomplete.
   */
  getCommentsForProject: (projectId: string) => {
    const projectTasks = get().tasks.filter(
      (task) => task.projectId === projectId,
    );
    return extractUniqueSortedComments(projectTasks);
  },

  /**
   * Returns distinct, non-empty comments for all tasks of a project from IndexedDB.
   */
  getUniqueTaskCommentsForProject: async (projectId: string) => {
    const tasks = await db.tasks.where("projectId").equals(projectId).toArray();
    return extractUniqueSortedComments(tasks);
  },

  /**
   * Returns the number of tasks per distinct, non-empty comment for one project.
   */
  getTaskCommentCountsForProject: async (projectId: string) => {
    const tasks = await db.tasks.where("projectId").equals(projectId).toArray();

    const counts: Record<string, number> = {};
    for (const task of tasks) {
      const comment = (task.comment ?? "").trim();
      if (comment) {
        counts[comment] = (counts[comment] ?? 0) + 1;
      }
    }
    return counts;
  },

  /**
   * Calculates the total booked time in hours per distinct task comment for a project.
   */
  getTaskCommentHoursForProject: async (projectId: string) => {
    const tasks = await db.tasks.where("projectId").equals(projectId).toArray();

    const secondsByComment: Record<string, number> = {};
    for (const task of tasks) {
      const comment = (task.comment ?? "").trim();
      if (!comment || !task.timeEnd) {
        continue;
      }

      const startTime = dayjs(`${task.date}T${task.timeStart}`);
      const endTime = dayjs(`${task.date}T${task.timeEnd}`);
      const diffInSeconds = endTime.diff(startTime, "second");

      if (diffInSeconds > 0) {
        secondsByComment[comment] =
          (secondsByComment[comment] ?? 0) + diffInSeconds;
      }
    }

    return Object.fromEntries(
      Object.entries(secondsByComment).map(([comment, totalSeconds]) => [
        comment,
        totalSeconds / 3600,
      ]),
    );
  },

  /**
   * Renames a project-scoped task comment and updates all matching tasks.
   */
  renameTaskCommentForProject: async (
    projectId: string,
    oldComment: string,
    newComment: string,
  ) => {
    const normalizedOldComment = oldComment.trim();
    const normalizedNewComment = newComment.trim();

    if (!normalizedNewComment) {
      throw new Error("COMMENT_REQUIRED");
    }

    if (normalizedOldComment === normalizedNewComment) {
      return;
    }

    const tasksForProject = await db.tasks
      .where("projectId")
      .equals(projectId)
      .toArray();

    const hasConflict = tasksForProject.some((task) => {
      const comment = (task.comment ?? "").trim();
      return (
        comment === normalizedNewComment && comment !== normalizedOldComment
      );
    });

    if (hasConflict) {
      throw new Error("COMMENT_ALREADY_EXISTS");
    }

    await db.transaction("rw", db.tasks, async () => {
      const tasksToRename = tasksForProject.filter(
        (task) => (task.comment ?? "").trim() === normalizedOldComment,
      );

      for (const task of tasksToRename) {
        await db.tasks.update(task.id, { comment: normalizedNewComment });
      }
    });

    const tasks = await db.tasks.toArray();
    set({ tasks });
  },
});
