import { describe, expect, it } from "vitest";
import { ProjectBudget } from "@/models/ProjectBudget";
import {
  formatBudgetMetricNumber,
  formatBudgetMetrics,
  formatDepletionPercentage,
  formatSummaryBudgetDepletion,
  getOverlappingBudgetHours,
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

  describe("getOverlappingBudgetHours", () => {
    const projectABudgets: ProjectBudget[] = [
      {
        id: "b1",
        projectId: "proj-a",
        startDate: "2026-10-01",
        endDate: "2026-12-31",
        purpose: "Q4 Budget",
        hours: 100,
      },
      {
        id: "b2",
        projectId: "proj-a",
        startDate: "2026-09-15",
        endDate: "2026-11-01",
        purpose: "Autumn Transition",
        hours: 30,
      },
      {
        id: "b3",
        projectId: "proj-other",
        startDate: "2026-09-01",
        endDate: "2026-12-31",
        purpose: "Other Project Budget",
        hours: 500,
      },
    ];

    it("returns 0 for range before any budget starts (Example 1: 14.09.26 - 14.09.26)", () => {
      expect(
        getOverlappingBudgetHours(projectABudgets, "proj-a", [
          "2026-09-14",
          "2026-09-14",
        ]),
      ).toBe(0);
    });

    it("returns 30 for single-day range overlapping only second budget (Example 2: 15.09.26 - 15.09.26)", () => {
      expect(
        getOverlappingBudgetHours(projectABudgets, "proj-a", [
          "2026-09-15",
          "2026-09-15",
        ]),
      ).toBe(30);
    });

    it("returns 30 when end date is null in single-day selection", () => {
      expect(
        getOverlappingBudgetHours(projectABudgets, "proj-a", [
          "2026-09-15",
          null,
        ]),
      ).toBe(30);
    });

    it("returns 130 for range overlapping both budgets (Example 3: 01.10.26 - 07.10.26)", () => {
      expect(
        getOverlappingBudgetHours(projectABudgets, "proj-a", [
          "2026-10-01",
          "2026-10-07",
        ]),
      ).toBe(130);
    });

    it("returns 100 for range overlapping only first budget (Example 4: 02.11.26 - 31.12.26)", () => {
      expect(
        getOverlappingBudgetHours(projectABudgets, "proj-a", [
          "2026-11-02",
          "2026-12-31",
        ]),
      ).toBe(100);
    });

    it("sums all project budgets when date range is null", () => {
      expect(
        getOverlappingBudgetHours(projectABudgets, "proj-a", [null, null]),
      ).toBe(130);
    });

    it("handles reversed start and end dates gracefully", () => {
      expect(
        getOverlappingBudgetHours(projectABudgets, "proj-a", [
          "2026-10-07",
          "2026-10-01",
        ]),
      ).toBe(130);
    });

    it("returns 0 when projectId does not match or budgets array is empty", () => {
      expect(
        getOverlappingBudgetHours(projectABudgets, "unknown-project", [
          "2026-10-01",
          "2026-10-07",
        ]),
      ).toBe(0);
      expect(
        getOverlappingBudgetHours([], "proj-a", ["2026-10-01", "2026-10-07"]),
      ).toBe(0);
    });
  });

  describe("formatDepletionPercentage", () => {
    it("formats 0% when total is 0 or negative", () => {
      expect(formatDepletionPercentage(0, 0)).toBe("0%");
      expect(formatDepletionPercentage(50, 0)).toBe("0%");
      expect(formatDepletionPercentage(50, -10)).toBe("0%");
    });

    it("formats 0% when part is 0 or negative", () => {
      expect(formatDepletionPercentage(0, 100)).toBe("0%");
      expect(formatDepletionPercentage(-10, 100)).toBe("0%");
    });

    it("formats exact integers without decimal places", () => {
      expect(formatDepletionPercentage(17, 100)).toBe("17%");
      expect(formatDepletionPercentage(75, 100)).toBe("75%");
      expect(formatDepletionPercentage(100, 100)).toBe("100%");
    });

    it("formats at most 1 decimal place when needed", () => {
      expect(formatDepletionPercentage(1.5, 100)).toBe("1.5%");
      expect(formatDepletionPercentage(1, 3)).toBe("33.3%");
      expect(formatDepletionPercentage(36, 88)).toBe("40.9%");
    });
  });

  describe("formatSummaryBudgetDepletion", () => {
    it("formats budget depletion percentage and hover tooltip matching requirements", () => {
      expect(formatSummaryBudgetDepletion(22.5, 30)).toEqual({
        label: "Budget: 75%",
        tooltip: "22.5/30 hours",
      });
      expect(formatSummaryBudgetDepletion(75, 100)).toEqual({
        label: "Budget: 75%",
        tooltip: "75/100 hours",
      });
      expect(formatSummaryBudgetDepletion(36, 88)).toEqual({
        label: "Budget: 40.9%",
        tooltip: "36/88 hours",
      });
      expect(formatSummaryBudgetDepletion(1.5, 100)).toEqual({
        label: "Budget: 1.5%",
        tooltip: "1.5/100 hours",
      });
      expect(formatSummaryBudgetDepletion(17, 100)).toEqual({
        label: "Budget: 17%",
        tooltip: "17/100 hours",
      });
    });

    it("formats 0% when spent is 0 or negative", () => {
      expect(formatSummaryBudgetDepletion(0, 30)).toEqual({
        label: "Budget: 0%",
        tooltip: "0/30 hours",
      });
      expect(formatSummaryBudgetDepletion(-5, 30)).toEqual({
        label: "Budget: 0%",
        tooltip: "0/30 hours",
      });
    });

    it("formats depletion when spent exceeds budget (>100%)", () => {
      expect(formatSummaryBudgetDepletion(150, 100)).toEqual({
        label: "Budget: 150%",
        tooltip: "150/100 hours",
      });
    });

    it("handles 0 budget gracefully", () => {
      expect(formatSummaryBudgetDepletion(10, 0)).toEqual({
        label: "Budget: 0%",
        tooltip: "10/0 hours",
      });
    });

    it("formats decimals up to 2 places without trailing zeroes in tooltip and 1 decimal in label", () => {
      expect(formatSummaryBudgetDepletion(1.5, 30)).toEqual({
        label: "Budget: 5%",
        tooltip: "1.5/30 hours",
      });
      expect(formatSummaryBudgetDepletion(3.3333, 10)).toEqual({
        label: "Budget: 33.3%",
        tooltip: "3.33/10 hours",
      });
    });
  });
});
