import { ProjectBudget } from "@/models/ProjectBudget";
import { calculatePercentage } from "./time";

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
