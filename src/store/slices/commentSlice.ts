import { db } from "@/store/db";
import { StoreGet, StoreSet } from "@/store/types";
import dayjs from "dayjs";

export const createCommentSlice = (_set: StoreSet, get: StoreGet) => ({
  /**
   * Returns distinct, non-empty task comments for a project to feed autocomplete.
   */
  getCommentsForProject: (projectId: string) => {
    const comments = get()
      .tasks.filter((task) => task.projectId === projectId)
      .map((task) => (task.comment ?? "").trim())
      .filter((comment) => comment.length > 0);

    return Array.from(new Set(comments)).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  },

  /**
   * Returns distinct, non-empty comments for all tasks of a project from IndexedDB.
   */
  getUniqueTaskCommentsForProject: async (projectId: string) => {
    const tasks = await db.tasks.where("projectId").equals(projectId).toArray();

    const comments = tasks
      .map((task) => (task.comment ?? "").trim())
      .filter((comment) => comment.length > 0);

    return Array.from(new Set(comments)).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  },

  /**
   * Returns the number of tasks per distinct, non-empty comment for one project.
   */
  getTaskCommentCountsForProject: async (projectId: string) => {
    const tasks = await db.tasks.where("projectId").equals(projectId).toArray();

    return tasks.reduce<Record<string, number>>((counts, task) => {
      const comment = (task.comment ?? "").trim();
      if (!comment) {
        return counts;
      }

      counts[comment] = (counts[comment] ?? 0) + 1;
      return counts;
    }, {});
  },

  /**
   * Calculates the total booked time in hours per distinct task comment for a project.
   */
  getTaskCommentHoursForProject: async (projectId: string) => {
    const tasks = await db.tasks.where("projectId").equals(projectId).toArray();

    const secondsByComment = tasks.reduce<Record<string, number>>(
      (seconds, task) => {
        const comment = (task.comment ?? "").trim();
        if (!comment || !task.timeEnd) {
          return seconds;
        }

        const startTime = dayjs(`${task.date}T${task.timeStart}`);
        const endTime = dayjs(`${task.date}T${task.timeEnd}`);
        const diffInSeconds = endTime.diff(startTime, "second");

        if (diffInSeconds > 0) {
          seconds[comment] = (seconds[comment] ?? 0) + diffInSeconds;
        }

        return seconds;
      },
      {},
    );

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
    _set({ tasks });
  },
});
