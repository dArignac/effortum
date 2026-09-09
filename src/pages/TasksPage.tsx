import { useEffortumStore } from "@/store";
import { Button, Group, Select, Stack, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useMemo, useRef, useState } from "react";

type CommentRow = {
  original: string;
  current: string;
  taskCount: number;
  spentHours: number;
};

export function TasksPage() {
  const projects = useEffortumStore((state) => state.projects);
  const loadFromIndexedDb = useEffortumStore(
    (state) => state.loadFromIndexedDb,
  );
  const getUniqueTaskCommentsForProject = useEffortumStore(
    (state) => state.getUniqueTaskCommentsForProject,
  );
  const getTaskCommentCountsForProject = useEffortumStore(
    (state) => state.getTaskCommentCountsForProject,
  );
  const getTaskCommentHoursForProject = useEffortumStore(
    (state) => state.getTaskCommentHoursForProject,
  );
  const renameTaskCommentForProject = useEffortumStore(
    (state) => state.renameTaskCommentForProject,
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [commentRows, setCommentRows] = useState<CommentRow[]>([]);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const isSavingRef = useRef(false);

  const projectOptions = useMemo(
    () =>
      projects
        .map((project) => ({ value: project.id, label: project.name }))
        .sort((a, b) =>
          a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
        ),
    [projects],
  );

  useEffect(() => {
    if (projects.length === 0) {
      void loadFromIndexedDb();
    }
  }, [loadFromIndexedDb, projects.length]);

  useEffect(() => {
    const loadComments = async () => {
      if (!selectedProjectId) {
        setCommentRows([]);
        return;
      }

      try {
        const comments =
          await getUniqueTaskCommentsForProject(selectedProjectId);
        const commentCounts =
          await getTaskCommentCountsForProject(selectedProjectId);
        const commentHours =
          await getTaskCommentHoursForProject(selectedProjectId);

        setCommentRows(
          comments.map((comment) => ({
            original: comment,
            current: comment,
            taskCount: commentCounts[comment] ?? 0,
            spentHours: commentHours[comment] ?? 0,
          })),
        );
      } catch {
        notifications.show({
          message: "Failed to load task comments.",
          color: "red",
          "data-testid": "toast-task-comment-load-error",
        });
        setCommentRows([]);
      }
    };

    void loadComments();
  }, [
    selectedProjectId,
    getTaskCommentCountsForProject,
    getTaskCommentHoursForProject,
    getUniqueTaskCommentsForProject,
  ]);

  const saveComment = async (index: number) => {
    if (!selectedProjectId || isSavingRef.current) {
      return;
    }

    const row = commentRows[index];
    if (!row) {
      return;
    }

    const nextValue = row.current.trim();
    if (!nextValue) {
      notifications.show({
        message: "Comment is required.",
        color: "red",
        "data-testid": "toast-task-comment-update-error-required",
      });
      return;
    }

    if (nextValue === row.original) {
      return;
    }

    isSavingRef.current = true;
    setSavingIndex(index);

    try {
      await renameTaskCommentForProject(
        selectedProjectId,
        row.original,
        nextValue,
      );

      setCommentRows((current) =>
        current.map((entry, entryIndex) =>
          entryIndex === index
            ? {
                original: nextValue,
                current: nextValue,
                taskCount: entry.taskCount,
                spentHours: entry.spentHours,
              }
            : entry,
        ),
      );

      notifications.show({
        message: "Task comments updated successfully!",
        "data-testid": "toast-task-comment-update-success",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message === "COMMENT_ALREADY_EXISTS"
          ? "Comment already exists for this project."
          : "Failed to update task comments. Please try again.";

      notifications.show({
        message,
        color: "red",
        "data-testid":
          message === "Comment already exists for this project."
            ? "toast-task-comment-update-error-duplicate"
            : "toast-task-comment-update-error-generic",
      });
    } finally {
      isSavingRef.current = false;
      setSavingIndex(null);
    }
  };

  return (
    <Stack data-testid="tasks-page" gap="md">
      <Text fw={700}>Task Management</Text>

      <Select
        data-testid="project-select"
        label="Project"
        placeholder="Select project"
        data={projectOptions}
        value={selectedProjectId}
        onChange={setSelectedProjectId}
        searchable
        clearable
      />

      {!selectedProjectId && (
        <Text c="dimmed" data-testid="tasks-no-project-selected">
          Select a project to manage task comments.
        </Text>
      )}

      {selectedProjectId && commentRows.length === 0 && (
        <Text c="dimmed" data-testid="tasks-empty-state">
          No task comments found for this project.
        </Text>
      )}

      {selectedProjectId && (
        <Text fw={700} data-testid="tasks-list-label">
          Tasks
        </Text>
      )}

      {selectedProjectId &&
        commentRows.map((row, index) => {
          const hasChanges = row.current.trim() !== row.original;
          const isDisabled =
            !hasChanges ||
            savingIndex !== null ||
            row.current.trim().length === 0;

          return (
            <Group
              key={`${row.original}-${index}`}
              wrap="nowrap"
              w="100%"
              data-testid={`task-comment-row-${index}`}
            >
              <TextInput
                data-testid={`task-comment-input-${index}`}
                value={row.current}
                style={{ flex: "1 1 0", minWidth: 0 }}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  setCommentRows((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index
                        ? { ...entry, current: nextValue }
                        : entry,
                    ),
                  );
                }}
                aria-label={`Task comment ${index + 1}`}
              />
              <Text
                c="dimmed"
                size="sm"
                w={160}
                ta="right"
                style={{
                  whiteSpace: "nowrap",
                  fontVariantNumeric: "tabular-nums",
                }}
                data-testid={`task-comment-count-${index}`}
              >
                {row.taskCount === 1 ? "1 task" : `${row.taskCount} tasks`},{" "}
                {row.spentHours.toFixed(2)} h
              </Text>
              <Button
                data-testid={`button-save-task-comment-${index}`}
                miw={84}
                disabled={isDisabled}
                loading={savingIndex === index}
                onClick={() => saveComment(index)}
              >
                Save
              </Button>
            </Group>
          );
        })}
    </Stack>
  );
}
