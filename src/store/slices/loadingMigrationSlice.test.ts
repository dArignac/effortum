import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLoadingMigrationSlice } from "./loadingMigrationSlice";

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    tasks: {
      limit: vi.fn(),
      where: vi.fn(),
      toArray: vi.fn(),
      update: vi.fn(),
    },
    projects: {
      toArray: vi.fn(),
      orderBy: vi.fn(),
      get: vi.fn(),
      add: vi.fn(),
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

describe("createLoadingMigrationSlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-08T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loadFromIndexedDb toggles loading state and loads initial data", async () => {
    const set = vi.fn();
    const state = {
      projects: [],
      backfillProjectRelationsIfMissing: vi.fn(),
    };
    const get = vi.fn(() => state);

    const limitToArray = vi.fn().mockResolvedValue([{ projectId: "p1" }]);
    mockDb.tasks.limit.mockReturnValue({ toArray: limitToArray });

    const betweenToArray = vi.fn().mockResolvedValue([{ id: "t1" }]);
    const between = vi.fn(() => ({ toArray: betweenToArray }));
    mockDb.tasks.where.mockReturnValue({ between });

    const projectsArray = [{ id: "p1", name: "Alpha" }];
    const orderByToArray = vi.fn().mockResolvedValue(projectsArray);
    mockDb.projects.orderBy.mockReturnValue({ toArray: orderByToArray });
    mockDb.overtime.toArray.mockResolvedValue([{ id: "o1" }]);
    mockDb.settings.toArray.mockResolvedValue([{ id: "s1" }]);

    const slice = createLoadingMigrationSlice(set as never, get as never);

    await slice.loadFromIndexedDb();

    expect(set).toHaveBeenNthCalledWith(1, { isDataLoading: true });
    expect(state.backfillProjectRelationsIfMissing).not.toHaveBeenCalled();
    expect(mockDb.tasks.where).toHaveBeenCalledWith("date");
    expect(between).toHaveBeenCalledWith(
      "2026-09-08",
      "2026-09-08",
      true,
      true,
    );
    expect(set).toHaveBeenCalledWith({
      tasks: [{ id: "t1" }],
      projects: projectsArray,
      overtime: [{ id: "o1" }],
      settings: [{ id: "s1" }],
    });
    expect(set).toHaveBeenLastCalledWith({ isDataLoading: false });
  });

  it("loadFromIndexedDb triggers backfill when first task has no projectId", async () => {
    const set = vi.fn();
    const state = {
      projects: [],
      backfillProjectRelationsIfMissing: vi.fn().mockResolvedValue(undefined),
    };
    const get = vi.fn(() => state);

    mockDb.tasks.limit.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([{ projectId: undefined }]),
    });
    mockDb.tasks.where.mockReturnValue({
      between: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })),
    });
    mockDb.projects.orderBy.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    });
    mockDb.overtime.toArray.mockResolvedValue([]);
    mockDb.settings.toArray.mockResolvedValue([]);

    const slice = createLoadingMigrationSlice(set as never, get as never);

    await slice.loadFromIndexedDb();

    expect(state.backfillProjectRelationsIfMissing).toHaveBeenCalledTimes(1);
  });

  it("backfillProjectRelationsIfMissing creates fallback project and updates orphan task", async () => {
    const set = vi.fn();
    const state = {
      projects: [],
    };
    const get = vi.fn(() => state);

    mockDb.projects.toArray.mockResolvedValue([]);
    mockDb.tasks.toArray.mockResolvedValue([
      { id: "t1", projectId: "", project: "" },
    ]);

    const slice = createLoadingMigrationSlice(set as never, get as never);

    await slice.backfillProjectRelationsIfMissing();

    expect(mockDb.projects.add).toHaveBeenCalledTimes(1);
    expect(mockDb.tasks.update).toHaveBeenCalledWith(
      "t1",
      expect.objectContaining({
        projectId: expect.any(String),
        project: "Migrated Project",
      }),
    );
  });
});
