import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import {
  getTaskUsageTimestamp,
  sortCommentsByLastUsed,
  sortProjectsByLastUsed,
} from "./usageSort";

describe("getTaskUsageTimestamp", () => {
  it("computes startMs and endMs for a completed task", () => {
    const ts = getTaskUsageTimestamp({
      date: "2026-09-10",
      timeStart: "09:15",
      timeEnd: "10:45",
    });

    expect(ts).toEqual({
      startMs: dayjs("2026-09-10T09:15").valueOf(),
      endMs: dayjs("2026-09-10T10:45").valueOf(),
    });
  });

  it("assigns MAX_SAFE_INTEGER endMs when task is running", () => {
    const emptyEnd = getTaskUsageTimestamp({
      date: "2026-09-10",
      timeStart: "09:15",
      timeEnd: "",
    });
    const undefinedEnd = getTaskUsageTimestamp({
      date: "2026-09-10",
      timeStart: "09:15",
    });
    const whitespaceEnd = getTaskUsageTimestamp({
      date: "2026-09-10",
      timeStart: "09:15",
      timeEnd: "   ",
    });

    expect(emptyEnd.endMs).toBe(Number.MAX_SAFE_INTEGER);
    expect(undefinedEnd.endMs).toBe(Number.MAX_SAFE_INTEGER);
    expect(whitespaceEnd.endMs).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe("sortProjectsByLastUsed", () => {
  it("sorts used projects across multiple dates from most recent to least recent", () => {
    const projects = [
      { id: "p1", name: "Alpha" },
      { id: "p2", name: "Beta" },
      { id: "p3", name: "Gamma" },
    ];
    const tasks = [
      {
        date: "2026-08-01",
        timeStart: "14:00",
        timeEnd: "15:00",
        projectId: "p1",
      },
      {
        date: "2026-09-15",
        timeStart: "09:00",
        timeEnd: "10:00",
        projectId: "p3",
      },
      {
        date: "2026-09-10",
        timeStart: "11:00",
        timeEnd: "12:00",
        projectId: "p2",
      },
    ];

    expect(sortProjectsByLastUsed(projects, tasks)).toEqual([
      "Gamma",
      "Beta",
      "Alpha",
    ]);
  });

  it("sorts same-day projects chronologically by latest task start time", () => {
    const projects = [
      { id: "p1", name: "Alpha" },
      { id: "p2", name: "Beta" },
    ];
    const tasks = [
      {
        date: "2026-09-15",
        timeStart: "08:00",
        timeEnd: "09:00",
        projectId: "p1",
      },
      {
        date: "2026-09-15",
        timeStart: "09:30",
        timeEnd: "11:00",
        projectId: "p2",
      },
      {
        date: "2026-09-15",
        timeStart: "13:00",
        timeEnd: "14:00",
        projectId: "p1",
      },
    ];

    expect(sortProjectsByLastUsed(projects, tasks)).toEqual(["Alpha", "Beta"]);
  });

  it("ranks running tasks and later end times first when start times match", () => {
    const projects = [
      { id: "p1", name: "ShortTask" },
      { id: "p2", name: "LongTask" },
      { id: "p3", name: "RunningTask" },
    ];
    const tasks = [
      {
        date: "2026-09-15",
        timeStart: "10:00",
        timeEnd: "10:30",
        projectId: "p1",
      },
      {
        date: "2026-09-15",
        timeStart: "10:00",
        timeEnd: "11:15",
        projectId: "p2",
      },
      {
        date: "2026-09-15",
        timeStart: "10:00",
        timeEnd: "",
        projectId: "p3",
      },
    ];

    expect(sortProjectsByLastUsed(projects, tasks)).toEqual([
      "RunningTask",
      "LongTask",
      "ShortTask",
    ]);
  });

  it("places unused projects after used projects in case-insensitive alphabetical order", () => {
    const projects = [
      { id: "p1", name: "zeta" },
      { id: "p2", name: "Beta" },
      { id: "p3", name: "alpha" },
      { id: "p4", name: "UsedProject" },
    ];
    const tasks = [
      {
        date: "2026-07-01",
        timeStart: "08:00",
        timeEnd: "08:30",
        projectId: "p4",
      },
    ];

    expect(sortProjectsByLastUsed(projects, tasks)).toEqual([
      "UsedProject",
      "alpha",
      "Beta",
      "zeta",
    ]);
  });

  it("breaks identical timestamp ties deterministically in alphabetical order", () => {
    const projects = [
      { id: "p1", name: "gamma" },
      { id: "p2", name: "Alpha" },
      { id: "p3", name: "beta" },
    ];
    const tasks = [
      {
        date: "2026-09-15",
        timeStart: "09:00",
        timeEnd: "10:00",
        projectId: "p1",
      },
      {
        date: "2026-09-15",
        timeStart: "09:00",
        timeEnd: "10:00",
        projectId: "p2",
      },
      {
        date: "2026-09-15",
        timeStart: "09:00",
        timeEnd: "10:00",
        projectId: "p3",
      },
    ];

    expect(sortProjectsByLastUsed(projects, tasks)).toEqual([
      "Alpha",
      "beta",
      "gamma",
    ]);
  });

  it("preserves usage across project renames via canonical projectId and supports legacy project name fallback", () => {
    const projects = [
      { id: "p1", name: "Renamed Project" },
      { id: "p2", name: "Legacy Project" },
      { id: "p3", name: "Unused Project" },
    ];
    const tasks = [
      {
        date: "2026-09-12",
        timeStart: "14:00",
        timeEnd: "15:00",
        project: "Legacy Project",
      },
      {
        date: "2026-09-14",
        timeStart: "09:00",
        timeEnd: "10:00",
        projectId: "p1",
        project: "Old Project Name",
      },
    ];

    expect(sortProjectsByLastUsed(projects, tasks)).toEqual([
      "Renamed Project",
      "Legacy Project",
      "Unused Project",
    ]);
  });
});

describe("sortCommentsByLastUsed", () => {
  it("deduplicates trimmed non-empty comments and orders by most recent usage", () => {
    const tasks = [
      {
        date: "2026-09-01",
        timeStart: "09:00",
        timeEnd: "10:00",
        comment: "  Code review  ",
      },
      {
        date: "2026-09-02",
        timeStart: "09:00",
        timeEnd: "10:00",
        comment: "Feature implementation",
      },
      {
        date: "2026-09-03",
        timeStart: "08:00",
        timeEnd: "09:00",
        comment: "   ",
      },
      {
        date: "2026-09-03",
        timeStart: "10:00",
        timeEnd: "11:00",
        comment: "",
      },
      {
        date: "2026-09-04",
        timeStart: "15:00",
        timeEnd: "16:00",
        comment: "Code review",
      },
    ];

    expect(sortCommentsByLastUsed(tasks)).toEqual([
      "Code review",
      "Feature implementation",
    ]);
  });

  it("ranks running task comments ahead of completed ones at the same start minute and breaks ties alphabetically", () => {
    const tasks = [
      {
        date: "2026-09-10",
        timeStart: "09:00",
        timeEnd: "10:00",
        comment: "zebra",
      },
      {
        date: "2026-09-10",
        timeStart: "09:00",
        timeEnd: "10:00",
        comment: "Apple",
      },
      {
        date: "2026-09-10",
        timeStart: "09:00",
        timeEnd: "",
        comment: "Running item",
      },
    ];

    expect(sortCommentsByLastUsed(tasks)).toEqual([
      "Running item",
      "Apple",
      "zebra",
    ]);
  });
});
