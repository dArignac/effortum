import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTaskSlice } from "./taskSlice";

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    tasks: {
      toArray: vi.fn(),
      where: vi.fn(),
      add: vi.fn(),
      update: vi.fn(),
    },
    projects: {
      add: vi.fn(),
    },
  },
}));

vi.mock("@/store/db", () => ({
  db: mockDb,
}));

describe("createTaskSlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates project booked hours from positive durations", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({ projects: [], tasks: [] }));
    const slice = createTaskSlice(set as never, get as never);

    const equals = vi.fn(() => ({
      toArray: vi.fn().mockResolvedValue([
        {
          id: "t1",
          date: "2026-09-08",
          timeStart: "09:00",
          timeEnd: "10:30",
          projectId: "p1",
        },
        {
          id: "t2",
          date: "2026-09-08",
          timeStart: "11:00",
          timeEnd: "11:30",
          projectId: "p1",
        },
        {
          id: "t3",
          date: "2026-09-08",
          timeStart: "13:00",
          timeEnd: "12:00",
          projectId: "p1",
        },
      ]),
    }));
    mockDb.tasks.where.mockReturnValue({ equals });

    await expect(slice.getProjectBookedTimeHours("p1")).resolves.toBe(2);
    expect(mockDb.tasks.where).toHaveBeenCalledWith("projectId");
    expect(equals).toHaveBeenCalledWith("p1");
  });

  it("addTask creates missing project and persists normalized task", async () => {
    const set = vi.fn();
    const state = {
      projects: [],
      tasks: [],
    };
    const get = vi.fn(() => state);
    const slice = createTaskSlice(set as never, get as never);

    mockDb.tasks.toArray.mockResolvedValue([{ id: "t1" }]);

    await slice.addTask({
      id: "t1",
      date: "2026-09-08",
      timeStart: "09:00",
      projectName: "  Alpha  ",
      comment: "Work",
    });

    expect(mockDb.projects.add).toHaveBeenCalledTimes(1);
    expect(mockDb.tasks.add).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "t1",
        date: "2026-09-08",
        timeStart: "09:00",
        project: "Alpha",
        comment: "Work",
        timeEnd: "",
      }),
    );
    expect(set).toHaveBeenCalledWith({ tasks: [{ id: "t1" }] });
  });

  it("updateTask no-ops when task is missing", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({ projects: [], tasks: [] }));
    const slice = createTaskSlice(set as never, get as never);

    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await slice.updateTask("missing", { comment: "x" });

    expect(mockDb.tasks.update).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("updateTask applies provided fields and refreshes tasks", async () => {
    const set = vi.fn();
    const state = {
      projects: [{ id: "p1", name: "Alpha" }],
      tasks: [
        {
          id: "t1",
          date: "2026-09-08",
          timeStart: "09:00",
          timeEnd: "10:00",
          projectId: "p1",
          project: "Alpha",
          comment: "A",
        },
      ],
    };
    const get = vi.fn(() => state);
    const slice = createTaskSlice(set as never, get as never);

    mockDb.tasks.toArray.mockResolvedValue([{ id: "t1", comment: "Updated" }]);

    await slice.updateTask("t1", {
      projectName: "Alpha",
      comment: "Updated",
      timeEnd: "11:00",
    });

    expect(mockDb.tasks.update).toHaveBeenCalledWith(
      "t1",
      expect.objectContaining({
        projectId: "p1",
        project: "Alpha",
        comment: "Updated",
        timeEnd: "11:00",
      }),
    );
    expect(set).toHaveBeenCalledWith({
      tasks: [{ id: "t1", comment: "Updated" }],
    });
  });

  it("addTask rejects adding an active task when an active task is already running", async () => {
    const set = vi.fn();
    const state = {
      projects: [{ id: "p1", name: "Alpha" }],
      tasks: [
        {
          id: "t1",
          date: "2026-09-08",
          timeStart: "09:00",
          timeEnd: "",
          projectId: "p1",
          project: "Alpha",
          comment: "Existing running task",
        },
      ],
    };
    const get = vi.fn(() => state);
    const slice = createTaskSlice(set as never, get as never);

    await expect(
      slice.addTask({
        id: "t2",
        date: "2026-09-09",
        timeStart: "10:00",
        projectName: "Alpha",
        comment: "Second running task",
      }),
    ).rejects.toThrow("Only one active task is allowed");

    expect(mockDb.tasks.add).not.toHaveBeenCalled();
  });

  it("addTask allows adding a completed task when an active task is running", async () => {
    const set = vi.fn();
    const state = {
      projects: [{ id: "p1", name: "Alpha" }],
      tasks: [
        {
          id: "t1",
          date: "2026-09-08",
          timeStart: "09:00",
          timeEnd: "",
          projectId: "p1",
          project: "Alpha",
          comment: "Existing running task",
        },
      ],
    };
    const get = vi.fn(() => state);
    const slice = createTaskSlice(set as never, get as never);

    mockDb.tasks.toArray.mockResolvedValue([
      state.tasks[0],
      { id: "t2", timeEnd: "11:00" },
    ]);

    await slice.addTask({
      id: "t2",
      date: "2026-09-09",
      timeStart: "10:00",
      timeEnd: "11:00",
      projectName: "Alpha",
      comment: "Completed task",
    });

    expect(mockDb.tasks.add).toHaveBeenCalledTimes(1);
  });

  it("updateTask rejects clearing timeEnd when another active task is already running", async () => {
    const set = vi.fn();
    const state = {
      projects: [{ id: "p1", name: "Alpha" }],
      tasks: [
        {
          id: "t1",
          date: "2026-09-08",
          timeStart: "09:00",
          timeEnd: "",
          projectId: "p1",
          project: "Alpha",
          comment: "Running task",
        },
        {
          id: "t2",
          date: "2026-09-08",
          timeStart: "10:00",
          timeEnd: "11:00",
          projectId: "p1",
          project: "Alpha",
          comment: "Completed task",
        },
      ],
    };
    const get = vi.fn(() => state);
    const slice = createTaskSlice(set as never, get as never);

    await expect(
      slice.updateTask("t2", {
        timeEnd: "",
      }),
    ).rejects.toThrow("Only one active task is allowed");

    expect(mockDb.tasks.update).not.toHaveBeenCalled();
  });
});
