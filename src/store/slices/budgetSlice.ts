import { ProjectBudget } from "@/models/ProjectBudget";
import { db } from "@/store/db";
import {
  ProjectBudgetInput,
  ProjectBudgetUpdateInput,
  StoreGet,
  StoreSet,
} from "@/store/types";
import {
  MAX_BUDGET_HOURS,
  MAX_BUDGET_PURPOSE_LENGTH,
} from "../../utils/budget";
import { normalizeDate } from "../../utils/date";
import dayjs from "dayjs";

function validateAndNormalizeBudgetFields(fields: {
  startDate: string;
  endDate: string;
  purpose: string;
  hours: number;
}) {
  const rawStart = (fields.startDate ?? "").trim();
  const rawEnd = (fields.endDate ?? "").trim();
  const parsedStart = rawStart ? normalizeDate(rawStart) : null;
  const parsedEnd = rawEnd ? normalizeDate(rawEnd) : null;

  if (
    !parsedStart ||
    !parsedStart.isValid() ||
    !parsedEnd ||
    !parsedEnd.isValid()
  ) {
    throw new Error("BUDGET_DATES_REQUIRED");
  }

  const startDate = parsedStart.format("YYYY-MM-DD");
  const endDate = parsedEnd.format("YYYY-MM-DD");

  if (parsedEnd.isBefore(parsedStart, "day")) {
    throw new Error("BUDGET_END_BEFORE_START");
  }

  const purpose = (fields.purpose ?? "").trim();
  if (!purpose) {
    throw new Error("BUDGET_PURPOSE_REQUIRED");
  }
  if (purpose.length > MAX_BUDGET_PURPOSE_LENGTH) {
    throw new Error("BUDGET_PURPOSE_TOO_LONG");
  }

  const hours = Number(fields.hours);
  if (!Number.isFinite(hours) || hours <= 0) {
    throw new Error("BUDGET_HOURS_INVALID");
  }
  if (hours > MAX_BUDGET_HOURS) {
    throw new Error("BUDGET_HOURS_TOO_HIGH");
  }

  return {
    startDate,
    endDate,
    purpose,
    hours,
  };
}

export const createBudgetSlice = (set: StoreSet, get: StoreGet) => ({
  budgets: [] as ProjectBudget[],

  addProjectBudget: async (budget: ProjectBudgetInput) => {
    const existingProject = get().projects.find(
      (project) => project.id === budget.projectId,
    );
    if (!existingProject) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    const normalized = validateAndNormalizeBudgetFields({
      startDate: budget.startDate,
      endDate: budget.endDate,
      purpose: budget.purpose,
      hours: budget.hours,
    });

    const createdBudget: ProjectBudget = {
      id: budget.id || crypto.randomUUID(),
      projectId: existingProject.id,
      ...normalized,
    };

    await db.budgets.add(createdBudget);
    const budgets = await db.budgets.toArray();
    set({ budgets });
  },

  updateProjectBudget: async (
    id: string,
    updates: ProjectBudgetUpdateInput,
  ) => {
    const existingBudget = get().budgets.find((budget) => budget.id === id);
    if (!existingBudget) {
      throw new Error("BUDGET_NOT_FOUND");
    }

    const normalized = validateAndNormalizeBudgetFields({
      startDate: updates.startDate ?? existingBudget.startDate,
      endDate: updates.endDate ?? existingBudget.endDate,
      purpose: updates.purpose ?? existingBudget.purpose,
      hours: updates.hours ?? existingBudget.hours,
    });

    await db.budgets.update(id, normalized);
    const budgets = await db.budgets.toArray();
    set({ budgets });
  },

  deleteProjectBudget: async (id: string) => {
    const existingBudget = get().budgets.find((budget) => budget.id === id);
    if (!existingBudget) {
      throw new Error("BUDGET_NOT_FOUND");
    }

    await db.budgets.delete(id);
    const budgets = await db.budgets.toArray();
    set({ budgets });
  },

  getProjectBookedTimeHoursInRange: async (
    projectId: string,
    startDate: string,
    endDate: string,
  ) => {
    if (!projectId || !startDate || !endDate) {
      return 0;
    }

    const parsedStart = normalizeDate(startDate);
    const parsedEnd = normalizeDate(endDate);
    if (
      !parsedStart ||
      !parsedStart.isValid() ||
      !parsedEnd ||
      !parsedEnd.isValid()
    ) {
      return 0;
    }

    const normalizedStart = parsedStart.format("YYYY-MM-DD");
    const normalizedEnd = parsedEnd.format("YYYY-MM-DD");
    if (normalizedEnd < normalizedStart) {
      return 0;
    }

    const tasks = await db.tasks.where("projectId").equals(projectId).toArray();

    let totalSeconds = 0;
    for (const task of tasks) {
      if (!task.timeEnd) {
        continue;
      }
      if (task.date < normalizedStart || task.date > normalizedEnd) {
        continue;
      }
      const startTime = dayjs(`${task.date}T${task.timeStart}`);
      const endTime = dayjs(`${task.date}T${task.timeEnd}`);
      const diffInSeconds = endTime.diff(startTime, "second");
      if (diffInSeconds > 0) {
        totalSeconds += diffInSeconds;
      }
    }

    return totalSeconds / 3600;
  },
});
