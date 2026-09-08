import { beforeEach, describe, expect, it, vi } from "vitest";
import { createProjectSlice } from "./projectSlice";

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    projects: {
      add: vi.fn(),
      toArray: vi.fn(),
      update: vi.fn(),
    },
    tasks: {
      toArray: vi.fn(),
    },
    transaction: vi.fn(),
  },
}));

vi.mock("@/store/db", () => ({
  db: mockDb,
}));

describe("createProjectSlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds a project and refreshes projects state", async () => {
    const set = vi.fn();
    const state = { projects: [] };
    const get = vi.fn(() => state);

    const slice = createProjectSlice(set as never, get as never);
    const project = { id: "p1", name: "Alpha" };

    mockDb.projects.toArray.mockResolvedValue([project]);

    await slice.addProject(project);

    expect(mockDb.projects.add).toHaveBeenCalledWith(project);
    expect(set).toHaveBeenCalledWith({ projects: [project] });
  });

  it("throws PROJECT_NAME_REQUIRED for empty names", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({ projects: [{ id: "p1", name: "Alpha" }] }));

    const slice = createProjectSlice(set as never, get as never);

    await expect(slice.updateProjectName("p1", "   ")).rejects.toThrow(
      "PROJECT_NAME_REQUIRED",
    );
  });

  it("throws PROJECT_NOT_FOUND when project is missing", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({ projects: [] }));

    const slice = createProjectSlice(set as never, get as never);

    await expect(slice.updateProjectName("missing", "Renamed")).rejects.toThrow(
      "PROJECT_NOT_FOUND",
    );
  });

  it("maps Dexie constraint errors to PROJECT_NAME_ALREADY_EXISTS", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({ projects: [{ id: "p1", name: "Alpha" }] }));

    const slice = createProjectSlice(set as never, get as never);

    mockDb.transaction.mockRejectedValue({ name: "ConstraintError" });

    await expect(slice.updateProjectName("p1", "Beta")).rejects.toThrow(
      "PROJECT_NAME_ALREADY_EXISTS",
    );
  });

  it("updates project name and refreshes projects/tasks", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({ projects: [{ id: "p1", name: "Alpha" }] }));

    const slice = createProjectSlice(set as never, get as never);

    mockDb.transaction.mockImplementation(
      async (
        _mode: string,
        _projects: unknown,
        _tasks: unknown,
        fn: () => Promise<void>,
      ) => fn(),
    );
    mockDb.projects.toArray.mockResolvedValue([{ id: "p1", name: "Beta" }]);
    mockDb.tasks.toArray.mockResolvedValue([{ id: "t1", projectId: "p1" }]);

    await slice.updateProjectName("p1", " Beta ");

    expect(mockDb.projects.update).toHaveBeenCalledWith("p1", { name: "Beta" });
    expect(set).toHaveBeenCalledWith({
      projects: [{ id: "p1", name: "Beta" }],
      tasks: [{ id: "t1", projectId: "p1" }],
    });
  });
});
