import { useEffortumStore } from "@/store";
import { Stack, Text, TextInput } from "@mantine/core";
import { useMemo } from "react";

/**
 * Displays all existing projects in alphabetical order as editable textfields.
 * Editing is intentionally local-only for now as preparation for later rename support.
 */
export function ProjectsPage() {
  const projects = useEffortumStore((state) => state.projects);

  const sortedProjects = useMemo(
    () =>
      [...projects].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    [projects],
  );

  if (sortedProjects.length === 0) {
    return (
      <Stack data-testid="projects-page" gap="xs">
        <Text data-testid="projects-empty-state" c="dimmed">
          No projects found yet.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack data-testid="projects-page" gap="xs">
      {sortedProjects.map((project) => (
        <TextInput
          key={project.id}
          data-testid={`project-name-input-${project.id}`}
          defaultValue={project.name}
          label="Project"
        />
      ))}
    </Stack>
  );
}
