import { beforeEach, describe, expect, it, vi } from "vitest";
import { createProjectSlice } from "./projectSlice";

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    projects: {
      add: vi.fn(),
      toArray: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    tasks: {
      toArray: vi.fn(),
      update: vi.fn(),
      where: vi.fn(),
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

  it("getProjectTaskCount returns task count for a project", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({ projects: [] }));
    const count = vi.fn().mockResolvedValue(5);
    mockDb.tasks.where.mockReturnValue({
      equals: vi.fn().mockReturnValue({ count }),
    });

    const slice = createProjectSlice(set as never, get as never);
    const result = await slice.getProjectTaskCount("p1");

    expect(result).toBe(5);
    expect(mockDb.tasks.where).toHaveBeenCalledWith("projectId");
  });

  it("deleteProject throws PROJECT_NOT_FOUND when project does not exist", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({ projects: [] }));

    const slice = createProjectSlice(set as never, get as never);

    await expect(slice.deleteProject("missing")).rejects.toThrow(
      "PROJECT_NOT_FOUND",
    );
  });

  it("deleteProject throws PROJECT_HAS_TASKS when project has tasks and no options provided", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({ projects: [{ id: "p1", name: "Alpha" }] }));
    const count = vi.fn().mockResolvedValue(2);
    mockDb.tasks.where.mockReturnValue({
      equals: vi.fn().mockReturnValue({ count }),
    });

    const slice = createProjectSlice(set as never, get as never);

    await expect(slice.deleteProject("p1")).rejects.toThrow(
      "PROJECT_HAS_TASKS",
    );
  });

  it("deleteProject deletes an empty project directly", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({ projects: [{ id: "p1", name: "Alpha" }] }));
    const count = vi.fn().mockResolvedValue(0);
    mockDb.tasks.where.mockReturnValue({
      equals: vi.fn().mockReturnValue({ count }),
    });
    mockDb.projects.toArray.mockResolvedValue([]);
    mockDb.tasks.toArray.mockResolvedValue([]);

    const slice = createProjectSlice(set as never, get as never);
    await slice.deleteProject("p1");

    expect(mockDb.projects.delete).toHaveBeenCalledWith("p1");
    expect(set).toHaveBeenCalledWith({ projects: [], tasks: [] });
  });

  it("deleteProject deletes project and its tasks when taskAction is delete", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({ projects: [{ id: "p1", name: "Alpha" }] }));
    const count = vi.fn().mockResolvedValue(3);
    const deleteTasks = vi.fn().mockResolvedValue(3);
    mockDb.tasks.where.mockReturnValue({
      equals: vi.fn().mockReturnValue({ count, delete: deleteTasks }),
    });
    mockDb.transaction.mockImplementation(
      async (
        _mode: string,
        _projects: unknown,
        _tasks: unknown,
        fn: () => Promise<void>,
      ) => fn(),
    );
    mockDb.projects.toArray.mockResolvedValue([]);
    mockDb.tasks.toArray.mockResolvedValue([]);

    const slice = createProjectSlice(set as never, get as never);
    await slice.deleteProject("p1", { taskAction: "delete" });

    expect(deleteTasks).toHaveBeenCalled();
    expect(mockDb.projects.delete).toHaveBeenCalledWith("p1");
    expect(set).toHaveBeenCalledWith({ projects: [], tasks: [] });
  });

  it("deleteProject throws CANNOT_MOVE_TO_SAME_PROJECT when destination is same", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({ projects: [{ id: "p1", name: "Alpha" }] }));
    const count = vi.fn().mockResolvedValue(1);
    mockDb.tasks.where.mockReturnValue({
      equals: vi.fn().mockReturnValue({ count }),
    });

    const slice = createProjectSlice(set as never, get as never);
    await expect(
      slice.deleteProject("p1", {
        taskAction: "move",
        destinationProjectId: "p1",
      }),
    ).rejects.toThrow("CANNOT_MOVE_TO_SAME_PROJECT");
  });

  it("deleteProject throws DESTINATION_PROJECT_NOT_FOUND when destination does not exist", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({ projects: [{ id: "p1", name: "Alpha" }] }));
    const count = vi.fn().mockResolvedValue(1);
    mockDb.tasks.where.mockReturnValue({
      equals: vi.fn().mockReturnValue({ count }),
    });

    const slice = createProjectSlice(set as never, get as never);
    await expect(
      slice.deleteProject("p1", {
        taskAction: "move",
        destinationProjectId: "missing",
      }),
    ).rejects.toThrow("DESTINATION_PROJECT_NOT_FOUND");
  });

  it("deleteProject moves tasks to destination project and deletes project", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({
      projects: [
        { id: "p1", name: "Alpha" },
        { id: "p2", name: "Beta" },
      ],
    }));
    const count = vi.fn().mockResolvedValue(2);
    const tasksToMove = [
      { id: "t1", projectId: "p1", project: "Alpha" },
      { id: "t2", projectId: "p1", project: "Alpha" },
    ];
    const toArray = vi.fn().mockResolvedValue(tasksToMove);
    mockDb.tasks.where.mockReturnValue({
      equals: vi.fn().mockReturnValue({ count, toArray }),
    });
    mockDb.transaction.mockImplementation(
      async (
        _mode: string,
        _projects: unknown,
        _tasks: unknown,
        fn: () => Promise<void>,
      ) => fn(),
    );
    mockDb.projects.toArray.mockResolvedValue([{ id: "p2", name: "Beta" }]);
    mockDb.tasks.toArray.mockResolvedValue([
      { id: "t1", projectId: "p2", project: "Beta" },
      { id: "t2", projectId: "p2", project: "Beta" },
    ]);

    const slice = createProjectSlice(set as never, get as never);
    await slice.deleteProject("p1", {
      taskAction: "move",
      destinationProjectId: "p2",
    });

    expect(mockDb.tasks.update).toHaveBeenCalledWith("t1", {
      projectId: "p2",
      project: "Beta",
    });
    expect(mockDb.tasks.update).toHaveBeenCalledWith("t2", {
      projectId: "p2",
      project: "Beta",
    });
    expect(mockDb.projects.delete).toHaveBeenCalledWith("p1");
    expect(set).toHaveBeenCalledWith({
      projects: [{ id: "p2", name: "Beta" }],
      tasks: [
        { id: "t1", projectId: "p2", project: "Beta" },
        { id: "t2", projectId: "p2", project: "Beta" },
      ],
    });
  });
});
