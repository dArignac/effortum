import { useEffortumStore } from "@/store";
import { Button, Group, Select, Stack, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useMemo, useRef, useState } from "react";

type CommentRow = {
  original: string;
  current: string;
};

export function TasksPage() {
  const projects = useEffortumStore((state) => state.projects);
  const loadFromIndexedDb = useEffortumStore(
    (state) => state.loadFromIndexedDb,
  );
  const getUniqueTaskCommentsForProject = useEffortumStore(
    (state) => state.getUniqueTaskCommentsForProject,
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
        console.log(comments);
        setCommentRows(
          comments.map((comment) => ({ original: comment, current: comment })),
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
  }, [selectedProjectId, getUniqueTaskCommentsForProject]);

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
            ? { original: nextValue, current: nextValue }
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
              <Button
                data-testid={`button-save-task-comment-${index}`}
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
