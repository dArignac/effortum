import { useEffortumStore } from "@/store";
import { Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Displays and allows renaming projects in alphabetical order.
 */
export function ProjectsPage() {
  const projects = useEffortumStore((state) => state.projects);
  const loadFromIndexedDb = useEffortumStore(
    (state) => state.loadFromIndexedDb,
  );
  const updateProjectName = useEffortumStore(
    (state) => state.updateProjectName,
  );
  const [editedNames, setEditedNames] = useState<Record<string, string>>({});
  const [savingProjectId, setSavingProjectId] = useState<string | null>(null);
  const isSavingRef = useRef(false);

  const sortedProjects = useMemo(
    () =>
      [...projects].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    [projects],
  );

  useEffect(() => {
    if (projects.length === 0) {
      void loadFromIndexedDb();
    }
  }, [loadFromIndexedDb, projects.length]);

  if (sortedProjects.length === 0) {
    return (
      <Stack data-testid="projects-page" gap="xs">
        <Text data-testid="projects-empty-state" c="dimmed">
          No projects found yet.
        </Text>
      </Stack>
    );
  }

  /**
   * Saves a renamed project while preventing concurrent save operations.
   */
  const saveProjectName = async (projectId: string, originalName: string) => {
    if (isSavingRef.current) {
      return;
    }

    const nextName = (editedNames[projectId] ?? originalName).trim();
    if (!nextName) {
      notifications.show({
        message: "Project name is required.",
        color: "red",
        "data-testid": "toast-project-rename-error-required",
      });
      return;
    }

    if (nextName === originalName) {
      return;
    }

    isSavingRef.current = true;
    setSavingProjectId(projectId);

    try {
      await updateProjectName(projectId, nextName);
      notifications.show({
        message: "Project renamed successfully!",
        "data-testid": "toast-project-rename-success",
      });
      setEditedNames((current) => {
        const next = { ...current };
        delete next[projectId];
        return next;
      });
    } catch (error) {
      const message =
        error instanceof Error &&
        error.message === "PROJECT_NAME_ALREADY_EXISTS"
          ? "Project name already exists."
          : "Failed to rename project. Please try again.";

      notifications.show({
        message,
        color: "red",
        "data-testid":
          message === "Project name already exists."
            ? "toast-project-rename-error-duplicate"
            : "toast-project-rename-error-generic",
      });
    } finally {
      isSavingRef.current = false;
      setSavingProjectId(null);
    }
  };

  return (
    <Stack data-testid="projects-page" gap="xs">
      {sortedProjects.map((project, index) => {
        const currentName = editedNames[project.id] ?? project.name;
        const hasNameChanges = currentName !== project.name;
        const isSaveDisabled =
          !hasNameChanges ||
          savingProjectId !== null ||
          currentName.trim().length === 0;

        return (
          <Group
            key={project.id}
            wrap="nowrap"
            w="100%"
            data-testid={`project-row-${project.id}`}
          >
            <Text w={24} ta="right">
              {index + 1}.
            </Text>
            <TextInput
              data-testid={`project-name-input-${project.id}`}
              value={currentName}
              style={{ flex: 1, minWidth: 0 }}
              size="xs"
              onChange={(event) => {
                const nextValue = event.currentTarget.value;
                setEditedNames((current) => {
                  const next = { ...current };
                  if (nextValue === project.name) {
                    delete next[project.id];
                    return next;
                  }

                  next[project.id] = nextValue;
                  return next;
                });
              }}
              aria-label={`Project ${index + 1}`}
            />
            <Button
              data-testid={`button-save-project-${project.id}`}
              disabled={isSaveDisabled}
              loading={savingProjectId === project.id}
              onClick={() => saveProjectName(project.id, project.name)}
            >
              Save
            </Button>
          </Group>
        );
      })}
    </Stack>
  );
}
