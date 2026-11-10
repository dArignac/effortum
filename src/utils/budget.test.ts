import { describe, expect, it } from "vitest";
import { ProjectBudget } from "@/models/ProjectBudget";
import {
  formatBudgetMetricNumber,
  formatBudgetMetrics,
  sortProjectBudgetsNewestFirst,
} from "./budget";

describe("budget utilities", () => {
  describe("sortProjectBudgetsNewestFirst", () => {
    it("sorts budgets by startDate descending (newest first)", () => {
      const budgets: ProjectBudget[] = [
        {
          id: "b1",
          projectId: "p1",
          startDate: "2026-01-01",
          endDate: "2026-03-31",
          purpose: "Q1",
          hours: 80,
        },
        {
          id: "b2",
          projectId: "p1",
          startDate: "2026-07-01",
          endDate: "2026-09-30",
          purpose: "Q3",
          hours: 100,
        },
        {
          id: "b3",
          projectId: "p1",
          startDate: "2026-04-01",
          endDate: "2026-06-30",
          purpose: "Q2",
          hours: 90,
        },
      ];

      const sorted = sortProjectBudgetsNewestFirst(budgets);

      expect(sorted.map((b) => b.id)).toEqual(["b2", "b3", "b1"]);
      // Does not mutate original array
      expect(budgets.map((b) => b.id)).toEqual(["b1", "b2", "b3"]);
    });

    it("breaks ties by endDate descending and then purpose ascending", () => {
      const budgets: ProjectBudget[] = [
        {
          id: "b1",
          projectId: "p1",
          startDate: "2026-05-01",
          endDate: "2026-05-15",
          purpose: "Beta",
          hours: 40,
        },
        {
          id: "b2",
          projectId: "p1",
          startDate: "2026-05-01",
          endDate: "2026-05-31",
          purpose: "Full month",
          hours: 80,
        },
        {
          id: "b3",
          projectId: "p1",
          startDate: "2026-05-01",
          endDate: "2026-05-15",
          purpose: "Alpha",
          hours: 20,
        },
      ];

      const sorted = sortProjectBudgetsNewestFirst(budgets);
      expect(sorted.map((b) => b.id)).toEqual(["b2", "b3", "b1"]);
    });
  });

  describe("formatBudgetMetricNumber", () => {
    it("formats integers and decimals up to 2 places without trailing zeroes", () => {
      expect(formatBudgetMetricNumber(11)).toBe("11");
      expect(formatBudgetMetricNumber(4.5)).toBe("4.5");
      expect(formatBudgetMetricNumber(9.375)).toBe("9.38");
      expect(formatBudgetMetricNumber(0)).toBe("0");
      expect(formatBudgetMetricNumber(Number.NaN)).toBe("0");
    });
  });

  describe("formatBudgetMetrics", () => {
    it("formats spent and budgeted hours, days in brackets, and depletion percentage", () => {
      expect(formatBudgetMetrics(36, 88, 8)).toBe(
        "36/88 h (4.5/11 days) · 41%",
      );
      expect(formatBudgetMetrics(75, 100, 8)).toBe(
        "75/100 h (9.38/12.5 days) · 75%",
      );
    });

    it("defaults workingHoursPerDay to 8 when non-positive and handles 0 budgeted hours safely", () => {
      expect(formatBudgetMetrics(16, 32, 0)).toBe("16/32 h (2/4 days) · 50%");
      expect(formatBudgetMetrics(0, 0, 8)).toBe("0/0 h (0/0 days) · 0%");
    });
  });
});
