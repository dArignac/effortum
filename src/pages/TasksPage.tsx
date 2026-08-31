import { Stack, Text, Select } from "@mantine/core";
import { useEffect, useState } from "react";
import { useEffortumStore } from "@/store";

export function TasksPage() {
  const { tasks, projects, loadFromIndexedDb } = useEffortumStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);

  useEffect(() => {
    // Load data when component mounts
    loadFromIndexedDb();
  }, [loadFromIndexedDb]);

  useEffect(() => {
    // Filter tasks by selected project
    if (selectedProjectId) {
      setFilteredTasks(tasks.filter(task => task.projectId === selectedProjectId));
    } else {
      setFilteredTasks([]);
    }
  }, [selectedProjectId, tasks]);

  const projectOptions = projects.map(project => ({
    value: project.id,
    label: project.name
  }));

  return (
    <Stack data-testid="tasks-page" gap="xs">
      <Text data-testid="tasks-page-header">Tasks Page</Text>

      {projects.length > 0 ? (
        <>
          <Select
            data-testid="project-select"
            placeholder="Select a project"
            label="Project"
            data={projectOptions}
            value={selectedProjectId}
            onChange={setSelectedProjectId}
            searchable
            clearable
          />

          {selectedProjectId && filteredTasks.length > 0 ? (
            <Stack gap="xs" mt="md">
              <Text size="lg" fw={500}>Tasks for selected project:</Text>
              {filteredTasks.map(task => (
                <Text key={task.id}>{task.project} - {task.comment || "No comment"}</Text>
              ))}
            </Stack>
          ) : selectedProjectId ? (
            <Text c="dimmed">No tasks found for this project.</Text>
          ) : (
            <Text c="dimmed">Select a project to view its tasks.</Text>
          )}
        </>
      ) : (
        <Text c="dimmed">No projects available. Create a project first.</Text>
      )}
    </Stack>
  );
}