import { ProjectBudget } from "@/models/ProjectBudget";
import { Task } from "@/models/Task";
import { normalizeDate } from "./date";
import { calculatePercentage, getDuration } from "./time";

export const MAX_BUDGET_PURPOSE_LENGTH = 50;
export const MAX_BUDGET_HOURS = 17520;
export const DEFAULT_WORKING_HOURS_PER_DAY = 8;

/**
 * Sorts project budgets by startDate descending (newest first),
 * then by endDate descending, then by purpose ascending.
 */
export function sortProjectBudgetsNewestFirst(
  budgets: ProjectBudget[],
): ProjectBudget[] {
  return [...budgets].sort((a, b) => {
    const startComparison = b.startDate.localeCompare(a.startDate);
    if (startComparison !== 0) {
      return startComparison;
    }

    const endComparison = b.endDate.localeCompare(a.endDate);
    if (endComparison !== 0) {
      return endComparison;
    }

    return a.purpose.localeCompare(b.purpose);
  });
}

/**
 * Formats a numeric metric to at most 2 decimal places without trailing zeroes.
 */
export function formatBudgetMetricNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  if (rounded === 0) {
    return "0";
  }

  return String(rounded);
}

/**
 * Formats spent vs. budgeted hours, days in brackets, and depletion percentage.
 * Example: "36/88 h (4.5/11 days) · 41%"
 */
export function formatBudgetMetrics(
  spentHours: number,
  budgetedHours: number,
  workingHoursPerDay: number = DEFAULT_WORKING_HOURS_PER_DAY,
): string {
  const safeSpentHours =
    Number.isFinite(spentHours) && spentHours > 0 ? spentHours : 0;
  const safeBudgetedHours =
    Number.isFinite(budgetedHours) && budgetedHours > 0 ? budgetedHours : 0;
  const safeHoursPerDay =
    Number.isFinite(workingHoursPerDay) && workingHoursPerDay > 0
      ? workingHoursPerDay
      : DEFAULT_WORKING_HOURS_PER_DAY;

  const spentDays = safeSpentHours / safeHoursPerDay;
  const budgetedDays = safeBudgetedHours / safeHoursPerDay;
  const percentage = calculatePercentage(safeSpentHours, safeBudgetedHours);

  return `${formatBudgetMetricNumber(safeSpentHours)}/${formatBudgetMetricNumber(safeBudgetedHours)} h (${formatBudgetMetricNumber(spentDays)}/${formatBudgetMetricNumber(budgetedDays)} days) · ${percentage}%`;
}

/**
 * Calculates the sum of budget hours for a project whose date intervals overlap
 * with the selected date range [startDate, endDate] (at day precision).
 */
export function getOverlappingBudgetHours(
  budgets: ProjectBudget[],
  projectId: string,
  selectedDateRange: [string | null, string | null],
): number {
  if (!projectId || !budgets || budgets.length === 0) {
    return 0;
  }

  const [rawStart, rawEnd] = selectedDateRange;
  const startDay = rawStart ? normalizeDate(rawStart) : null;
  const endDay = normalizeDate(rawEnd ?? rawStart);

  const hasDateFilter = Boolean(startDay?.isValid() && endDay?.isValid());
  const rangeStart = hasDateFilter
    ? startDay!.isAfter(endDay!, "day")
      ? endDay
      : startDay
    : null;
  const rangeEnd = hasDateFilter
    ? startDay!.isAfter(endDay!, "day")
      ? startDay
      : endDay
    : null;

  let totalHours = 0;
  for (const budget of budgets) {
    if (budget.projectId !== projectId) {
      continue;
    }

    const budgetStart = normalizeDate(budget.startDate);
    const budgetEnd = normalizeDate(budget.endDate);

    if (!budgetStart?.isValid() || !budgetEnd?.isValid()) {
      continue;
    }

    if (rangeStart && rangeEnd) {
      const overlaps =
        !budgetStart.isAfter(rangeEnd, "day") &&
        !budgetEnd.isBefore(rangeStart, "day");

      if (!overlaps) {
        continue;
      }
    }

    if (Number.isFinite(budget.hours) && budget.hours > 0) {
      totalHours += budget.hours;
    }
  }

  return totalHours;
}

/**
 * Calculates cumulative spent hours for each overlapping budget of a project from
 * budget.startDate up to min(budget.endDate, rangeEnd).
 * When multiple budgets for the project overlap the selected date range, the total
 * spent hours is the sum of spent hours across all active budgets.
 */
export function calculateOverlappingBudgetSpentHours(
  budgets: ProjectBudget[],
  tasks: Task[],
  projectId: string,
  selectedDateRange: [string | null, string | null],
): number {
  if (
    !projectId ||
    !budgets ||
    budgets.length === 0 ||
    !tasks ||
    tasks.length === 0
  ) {
    return 0;
  }

  const [rawStart, rawEnd] = selectedDateRange;
  const startDay = rawStart ? normalizeDate(rawStart) : null;
  const endDay = normalizeDate(rawEnd ?? rawStart);

  const hasDateFilter = Boolean(startDay?.isValid() && endDay?.isValid());
  const rangeStart = hasDateFilter
    ? startDay!.isAfter(endDay!, "day")
      ? endDay
      : startDay
    : null;
  const rangeEnd = hasDateFilter
    ? startDay!.isAfter(endDay!, "day")
      ? startDay
      : endDay
    : null;

  const activeBudgetIntervals: Array<[string, string]> = [];

  for (const budget of budgets) {
    if (budget.projectId !== projectId) {
      continue;
    }

    const budgetStart = normalizeDate(budget.startDate);
    const budgetEnd = normalizeDate(budget.endDate);

    if (!budgetStart?.isValid() || !budgetEnd?.isValid()) {
      continue;
    }

    if (rangeStart && rangeEnd) {
      const overlaps =
        !budgetStart.isAfter(rangeEnd, "day") &&
        !budgetEnd.isBefore(rangeStart, "day");

      if (!overlaps) {
        continue;
      }
    }

    const effectiveEnd =
      rangeEnd && rangeEnd.isBefore(budgetEnd, "day") ? rangeEnd : budgetEnd;

    activeBudgetIntervals.push([
      budgetStart.format("YYYY-MM-DD"),
      effectiveEnd.format("YYYY-MM-DD"),
    ]);
  }

  if (activeBudgetIntervals.length === 0) {
    return 0;
  }

  const projectTasks = tasks.filter(
    (task) => task.projectId === projectId && Boolean(task.timeEnd),
  );

  let totalSpentMinutes = 0;

  for (const task of projectTasks) {
    const taskDay = normalizeDate(task.date);
    if (!taskDay?.isValid()) {
      continue;
    }
    const taskDate = taskDay.format("YYYY-MM-DD");

    const isInActiveBudget = activeBudgetIntervals.some(
      ([start, end]) => taskDate >= start && taskDate <= end,
    );

    if (isInActiveBudget) {
      const duration = getDuration(task.timeStart, task.timeEnd);
      if (duration > 0) {
        totalSpentMinutes += duration;
      }
    }
  }

  return totalSpentMinutes / 60;
}

export interface SummaryBudgetDepletion {
  label: string;
  tooltip: string;
}

/**
 * Formats a percentage with at most 1 decimal place (e.g. "1.5%" or "17%").
 * Returns "0%" when total <= 0 or part <= 0.
 */
export function formatDepletionPercentage(part: number, total: number): string {
  if (
    !Number.isFinite(total) ||
    !Number.isFinite(part) ||
    total <= 0 ||
    part <= 0
  ) {
    return "0%";
  }

  const percentage = (part / total) * 100;
  const rounded = Math.round((percentage + Number.EPSILON) * 10) / 10;
  return `${rounded}%`;
}

/**
 * Formats project budget depletion percentage label and detailed hover tooltip.
 * Example label: "Budget: 75%"
 * Example tooltip: "22.5/30 hours"
 */
export function formatSummaryBudgetDepletion(
  spentHours: number,
  budgetHours: number,
): SummaryBudgetDepletion {
  const safeSpentHours =
    Number.isFinite(spentHours) && spentHours > 0 ? spentHours : 0;
  const safeBudgetHours =
    Number.isFinite(budgetHours) && budgetHours > 0 ? budgetHours : 0;

  const percentage = formatDepletionPercentage(safeSpentHours, safeBudgetHours);

  return {
    label: `Budget: ${percentage}`,
    tooltip: `${formatBudgetMetricNumber(safeSpentHours)}/${formatBudgetMetricNumber(safeBudgetHours)} hours`,
  };
}
