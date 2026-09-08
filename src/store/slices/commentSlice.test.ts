import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCommentSlice } from "./commentSlice";

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    tasks: {
      where: vi.fn(),
      toArray: vi.fn(),
      update: vi.fn(),
    },
    transaction: vi.fn(),
  },
}));

vi.mock("@/store/db", () => ({
  db: mockDb,
}));

describe("createCommentSlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getCommentsForProject returns distinct sorted non-empty comments", () => {
    const set = vi.fn();
    const get = vi.fn(() => ({
      tasks: [
        { projectId: "p1", comment: "  Beta " },
        { projectId: "p1", comment: "alpha" },
        { projectId: "p1", comment: "" },
        { projectId: "p1", comment: "Alpha" },
        { projectId: "p2", comment: "zeta" },
      ],
    }));

    const slice = createCommentSlice(set as never, get as never);

    expect(slice.getCommentsForProject("p1")).toEqual([
      "alpha",
      "Alpha",
      "Beta",
    ]);
  });

  it("getUniqueTaskCommentsForProject reads from db and deduplicates", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({ tasks: [] }));

    const equals = vi.fn(() => ({
      toArray: vi
        .fn()
        .mockResolvedValue([
          { comment: "A" },
          { comment: " A " },
          { comment: "b" },
          { comment: "" },
        ]),
    }));
    mockDb.tasks.where.mockReturnValue({ equals });

    const slice = createCommentSlice(set as never, get as never);

    await expect(slice.getUniqueTaskCommentsForProject("p1")).resolves.toEqual([
      "A",
      "b",
    ]);
  });

  it("getTaskCommentCountsForProject returns per-comment counts", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({ tasks: [] }));

    const equals = vi.fn(() => ({
      toArray: vi
        .fn()
        .mockResolvedValue([
          { comment: "X" },
          { comment: "X" },
          { comment: " Y " },
          { comment: "" },
        ]),
    }));
    mockDb.tasks.where.mockReturnValue({ equals });

    const slice = createCommentSlice(set as never, get as never);

    await expect(slice.getTaskCommentCountsForProject("p1")).resolves.toEqual({
      X: 2,
      Y: 1,
    });
  });

  it("renameTaskCommentForProject rejects conflicts", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({ tasks: [] }));
    const equals = vi.fn(() => ({
      toArray: vi.fn().mockResolvedValue([
        { id: "t1", comment: "Old" },
        { id: "t2", comment: "New" },
      ]),
    }));
    mockDb.tasks.where.mockReturnValue({ equals });

    const slice = createCommentSlice(set as never, get as never);

    await expect(
      slice.renameTaskCommentForProject("p1", "Old", "New"),
    ).rejects.toThrow("COMMENT_ALREADY_EXISTS");
  });

  it("renameTaskCommentForProject updates matching tasks and refreshes state", async () => {
    const set = vi.fn();
    const get = vi.fn(() => ({ tasks: [] }));

    const tasksForProject = [
      { id: "t1", comment: "Old" },
      { id: "t2", comment: "Keep" },
      { id: "t3", comment: " Old " },
    ];

    const equals = vi.fn(() => ({
      toArray: vi.fn().mockResolvedValue(tasksForProject),
    }));
    mockDb.tasks.where.mockReturnValue({ equals });
    mockDb.transaction.mockImplementation(
      async (_mode: string, _tasks: unknown, fn: () => Promise<void>) => fn(),
    );
    mockDb.tasks.toArray.mockResolvedValue([{ id: "t1", comment: "New" }]);

    const slice = createCommentSlice(set as never, get as never);

    await slice.renameTaskCommentForProject("p1", "Old", "New");

    expect(mockDb.tasks.update).toHaveBeenCalledTimes(2);
    expect(mockDb.tasks.update).toHaveBeenCalledWith("t1", { comment: "New" });
    expect(mockDb.tasks.update).toHaveBeenCalledWith("t3", { comment: "New" });
    expect(set).toHaveBeenCalledWith({ tasks: [{ id: "t1", comment: "New" }] });
  });
});
