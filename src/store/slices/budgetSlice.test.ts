import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBudgetSlice } from "./budgetSlice";
import { createLoadingMigrationSlice } from "./loadingMigrationSlice";

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    budgets: {
      add: vi.fn(),
      toArray: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    tasks: {
      where: vi.fn(),
      limit: vi.fn(),
      filter: vi.fn(),
    },
    projects: {
      orderBy: vi.fn(),
    },
    overtime: {
      toArray: vi.fn(),
    },
    settings: {
      toArray: vi.fn(),
    },
  },
}));

vi.mock("@/store/db", () => ({
  db: mockDb,
}));

describe("createBudgetSlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds a valid project budget and updates state", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({
      projects: [{ id: "p1", name: "Alpha" }],
      budgets: [],
    }));

    const slice = createBudgetSlice(set as never, get as never);
    const savedBudget = {
      id: "b1",
      projectId: "p1",
      startDate: "2026-01-01",
      endDate: "2026-03-31",
      purpose: "Q1 Development",
      hours: 100,
    };
    mockDb.budgets.toArray.mockResolvedValue([savedBudget]);

    await slice.addProjectBudget({
      id: "b1",
      projectId: "p1",
      startDate: "2026-01-01",
      endDate: "2026-03-31",
      purpose: "  Q1 Development  ",
      hours: 100,
    });

    expect(mockDb.budgets.add).toHaveBeenCalledWith(savedBudget);
    expect(set).toHaveBeenCalledWith({ budgets: [savedBudget] });
  });

  it("validates project existence, dates, purpose max 50 chars, and hours > 0 on addProjectBudget", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({
      projects: [{ id: "p1", name: "Alpha" }],
      budgets: [],
    }));

    const slice = createBudgetSlice(set as never, get as never);

    await expect(
      slice.addProjectBudget({
        projectId: "missing",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        purpose: "Valid",
        hours: 10,
      }),
    ).rejects.toThrow("PROJECT_NOT_FOUND");

    await expect(
      slice.addProjectBudget({
        projectId: "p1",
        startDate: "",
        endDate: "2026-01-31",
        purpose: "Valid",
        hours: 10,
      }),
    ).rejects.toThrow("BUDGET_DATES_REQUIRED");

    await expect(
      slice.addProjectBudget({
        projectId: "p1",
        startDate: "2026-02-01",
        endDate: "2026-01-31",
        purpose: "Valid",
        hours: 10,
      }),
    ).rejects.toThrow("BUDGET_END_BEFORE_START");

    await expect(
      slice.addProjectBudget({
        projectId: "p1",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        purpose: "   ",
        hours: 10,
      }),
    ).rejects.toThrow("BUDGET_PURPOSE_REQUIRED");

    await expect(
      slice.addProjectBudget({
        projectId: "p1",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        purpose: "x".repeat(51),
        hours: 10,
      }),
    ).rejects.toThrow("BUDGET_PURPOSE_TOO_LONG");

    await expect(
      slice.addProjectBudget({
        projectId: "p1",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        purpose: "Valid",
        hours: 0,
      }),
    ).rejects.toThrow("BUDGET_HOURS_INVALID");
  });

  it("updates an existing budget and validates updated fields", async () => {
    const set = vi.fn();
    const existingBudget = {
      id: "b1",
      projectId: "p1",
      startDate: "2026-01-01",
      endDate: "2026-03-31",
      purpose: "Q1",
      hours: 80,
    };
    const get = vi.fn(() => ({
      projects: [{ id: "p1", name: "Alpha" }],
      budgets: [existingBudget],
    }));

    const slice = createBudgetSlice(set as never, get as never);

    await expect(
      slice.updateProjectBudget("missing", { hours: 90 }),
    ).rejects.toThrow("BUDGET_NOT_FOUND");

    await expect(
      slice.updateProjectBudget("b1", { purpose: "y".repeat(51) }),
    ).rejects.toThrow("BUDGET_PURPOSE_TOO_LONG");

    const updatedBudget = {
      ...existingBudget,
      purpose: "Q1 Revised",
      hours: 96,
    };
    mockDb.budgets.toArray.mockResolvedValue([updatedBudget]);

    await slice.updateProjectBudget("b1", {
      purpose: " Q1 Revised ",
      hours: 96,
    });

    expect(mockDb.budgets.update).toHaveBeenCalledWith("b1", {
      startDate: "2026-01-01",
      endDate: "2026-03-31",
      purpose: "Q1 Revised",
      hours: 96,
    });
    expect(set).toHaveBeenCalledWith({ budgets: [updatedBudget] });
  });

  it("deletes an existing budget and refreshes state", async () => {
    const set = vi.fn();
    const existingBudget = {
      id: "b1",
      projectId: "p1",
      startDate: "2026-01-01",
      endDate: "2026-03-31",
      purpose: "Q1",
      hours: 80,
    };
    const get = vi.fn(() => ({
      projects: [{ id: "p1", name: "Alpha" }],
      budgets: [existingBudget],
    }));

    const slice = createBudgetSlice(set as never, get as never);

    await expect(slice.deleteProjectBudget("missing")).rejects.toThrow(
      "BUDGET_NOT_FOUND",
    );

    mockDb.budgets.toArray.mockResolvedValue([]);
    await slice.deleteProjectBudget("b1");

    expect(mockDb.budgets.delete).toHaveBeenCalledWith("b1");
    expect(set).toHaveBeenCalledWith({ budgets: [] });
  });

  it("getProjectBookedTimeHoursInRange sums completed task hours inside [startDate, endDate]", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({ projects: [], budgets: [] }));
    const slice = createBudgetSlice(set as never, get as never);

    mockDb.tasks.where.mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          {
            id: "t-before",
            projectId: "p1",
            date: "2026-01-31",
            timeStart: "09:00",
            timeEnd: "12:00",
          },
          {
            id: "t-start",
            projectId: "p1",
            date: "2026-02-01",
            timeStart: "09:00",
            timeEnd: "11:30",
          },
          {
            id: "t-end",
            projectId: "p1",
            date: "2026-02-28",
            timeStart: "13:00",
            timeEnd: "15:00",
          },
          {
            id: "t-running",
            projectId: "p1",
            date: "2026-02-15",
            timeStart: "10:00",
            timeEnd: "",
          },
          {
            id: "t-after",
            projectId: "p1",
            date: "2026-03-01",
            timeStart: "08:00",
            timeEnd: "12:00",
          },
        ]),
      }),
    });

    const hours = await slice.getProjectBookedTimeHoursInRange(
      "p1",
      "2026-02-01",
      "2026-02-28",
    );

    expect(hours).toBe(4.5);
  });

  it("loads budgets in loadFromIndexedDb on startup", async () => {
    const set = vi.fn();
    const state = {
      projects: [],
      backfillProjectRelationsIfMissing: vi.fn(),
    };
    const get = vi.fn(() => state);

    mockDb.tasks.limit.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([{ projectId: "p1" }]),
    });
    mockDb.tasks.where.mockReturnValue({
      between: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })),
    });
    mockDb.tasks.filter.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    });
    mockDb.projects.orderBy.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([{ id: "p1", name: "Alpha" }]),
    });
    mockDb.overtime.toArray.mockResolvedValue([]);
    mockDb.settings.toArray.mockResolvedValue([]);
    mockDb.budgets.toArray.mockResolvedValue([
      {
        id: "b1",
        projectId: "p1",
        startDate: "2026-01-01",
        endDate: "2026-06-30",
        purpose: "H1",
        hours: 120,
      },
    ]);

    const loadingSlice = createLoadingMigrationSlice(
      set as never,
      get as never,
    );
    await loadingSlice.loadFromIndexedDb();

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        budgets: [
          expect.objectContaining({
            id: "b1",
            projectId: "p1",
            purpose: "H1",
            hours: 120,
          }),
        ],
      }),
    );
  });
});
