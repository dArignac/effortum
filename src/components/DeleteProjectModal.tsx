import { Project } from "@/models/Project";
import { useEffortumStore } from "@/store";
import {
  Alert,
  Button,
  Group,
  List,
  Loader,
  Modal,
  Radio,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useMemo, useState } from "react";

interface DeleteProjectModalProps {
  project: Project | null;
  onClose: () => void;
  onDeleted?: (projectId: string) => void;
}

export function DeleteProjectModal({
  project,
  onClose,
  onDeleted,
}: DeleteProjectModalProps) {
  const projects = useEffortumStore((state) => state.projects);
  const getProjectTaskCount = useEffortumStore(
    (state) => state.getProjectTaskCount,
  );
  const getUniqueTaskCommentsForProject = useEffortumStore(
    (state) => state.getUniqueTaskCommentsForProject,
  );
  const deleteProject = useEffortumStore((state) => state.deleteProject);

  const [taskCount, setTaskCount] = useState<number | null>(null);
  const [isLoadingTaskCount, setIsLoadingTaskCount] = useState(false);
  const [taskAction, setTaskAction] = useState<"delete" | "move">("delete");
  const [selectedDestinationId, setSelectedDestinationId] = useState<
    string | null
  >(null);
  const [conflictingComments, setConflictingComments] = useState<string[]>([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const availableDestinationProjects = useMemo(
    () =>
      projects
        .filter((p) => p.id !== project?.id)
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
        ),
    [projects, project?.id],
  );

  const destinationOptions = useMemo(
    () =>
      availableDestinationProjects.map((p) => ({
        value: p.id,
        label: p.name,
      })),
    [availableDestinationProjects],
  );

  const destinationProjectName = useMemo(
    () =>
      availableDestinationProjects.find((p) => p.id === selectedDestinationId)
        ?.name ?? "",
    [availableDestinationProjects, selectedDestinationId],
  );

  // Load task count when project changes
  useEffect(() => {
    let isActive = true;

    const loadCount = async () => {
      if (!project) {
        setTaskCount(null);
        setIsLoadingTaskCount(false);
        return;
      }

      setIsLoadingTaskCount(true);
      try {
        const count = await getProjectTaskCount(project.id);
        if (isActive) {
          setTaskCount(count);
          setTaskAction("delete");
          setSelectedDestinationId(null);
          setConflictingComments([]);
        }
      } catch {
        if (isActive) {
          setTaskCount(0);
        }
      } finally {
        if (isActive) {
          setIsLoadingTaskCount(false);
        }
      }
    };

    void loadCount();

    return () => {
      isActive = false;
    };
  }, [project, getProjectTaskCount]);

  // Check conflicting comments when destination project changes
  useEffect(() => {
    let isActive = true;

    const checkConflicts = async () => {
      if (!project || taskAction !== "move" || !selectedDestinationId) {
        setConflictingComments([]);
        return;
      }

      setIsCheckingConflicts(true);
      try {
        const [sourceComments, destComments] = await Promise.all([
          getUniqueTaskCommentsForProject(project.id),
          getUniqueTaskCommentsForProject(selectedDestinationId),
        ]);

        if (isActive) {
          const destSet = new Set(destComments.map((c) => c.trim()));
          const conflicts = sourceComments.filter((c) => destSet.has(c.trim()));
          setConflictingComments(conflicts);
        }
      } catch {
        if (isActive) {
          setConflictingComments([]);
        }
      } finally {
        if (isActive) {
          setIsCheckingConflicts(false);
        }
      }
    };

    void checkConflicts();

    return () => {
      isActive = false;
    };
  }, [
    project,
    taskAction,
    selectedDestinationId,
    getUniqueTaskCommentsForProject,
  ]);

  const handleClose = () => {
    if (isDeleting) return;
    setTaskCount(null);
    setIsLoadingTaskCount(false);
    setTaskAction("delete");
    setSelectedDestinationId(null);
    setConflictingComments([]);
    onClose();
  };

  const handleConfirmDelete = async () => {
    if (!project || isDeleting) return;

    setIsDeleting(true);
    try {
      if (taskCount === 0) {
        await deleteProject(project.id);
      } else if (taskAction === "delete") {
        await deleteProject(project.id, { taskAction: "delete" });
      } else if (taskAction === "move") {
        if (!selectedDestinationId) return;
        await deleteProject(project.id, {
          taskAction: "move",
          destinationProjectId: selectedDestinationId,
        });
      }

      notifications.show({
        message: "Project deleted successfully!",
        "data-testid": "toast-project-delete-success",
      });

      onDeleted?.(project.id);
      handleClose();
    } catch {
      notifications.show({
        message: "Failed to delete project. Please try again.",
        color: "red",
        "data-testid": "toast-project-delete-error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!project) {
    return null;
  }

  const isMoveDisabled =
    taskAction === "move" && (!selectedDestinationId || isCheckingConflicts);

  return (
    <Modal
      opened={Boolean(project)}
      onClose={handleClose}
      title="Delete Project"
      closeOnClickOutside={!isDeleting}
      closeOnEscape={!isDeleting}
    >
      <div data-testid="modal-delete-project">
        {isLoadingTaskCount ? (
          <Group justify="center" p="md">
            <Loader size="sm" />
          </Group>
        ) : taskCount === 0 ? (
          <Stack gap="md">
            <Text data-testid="text-delete-zero-tasks">
              Are you sure you want to delete project{" "}
              <Text span fw={700}>
                "{project.name}"
              </Text>
              ? This project has no tasks.
            </Text>

            <Group justify="flex-end" gap="sm">
              <Button
                variant="default"
                onClick={handleClose}
                data-testid="button-cancel-delete-project"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={handleConfirmDelete}
                data-testid="button-confirm-delete-project"
                loading={isDeleting}
              >
                Delete Project
              </Button>
            </Group>
          </Stack>
        ) : (
          <Stack gap="md">
            <Text data-testid="text-delete-has-tasks">
              Project{" "}
              <Text span fw={700}>
                "{project.name}"
              </Text>{" "}
              has {taskCount} task{taskCount === 1 ? "" : "s"}.
            </Text>
            <Text size="sm" c="dimmed">
              Choose whether you want to delete all tasks of this project or
              move them to another project:
            </Text>

            <Radio.Group
              value={taskAction}
              onChange={(val) => setTaskAction(val as "delete" | "move")}
            >
              <Stack gap="xs">
                <Radio
                  value="delete"
                  label="Delete all tasks of this project"
                  data-testid="radio-delete-tasks"
                />
                <Radio
                  value="move"
                  label="Move tasks to another project"
                  data-testid="radio-move-tasks"
                  disabled={availableDestinationProjects.length === 0}
                />
              </Stack>
            </Radio.Group>

            {availableDestinationProjects.length === 0 && (
              <Text size="xs" c="dimmed" data-testid="text-no-other-projects">
                No other projects available to move tasks to.
              </Text>
            )}

            {taskAction === "delete" && (
              <Alert
                color="red"
                variant="light"
                title="Warning"
                data-testid="alert-delete-all-tasks"
              >
                All {taskCount} task{taskCount === 1 ? "" : "s"} of this project
                will be permanently deleted. This action cannot be undone.
              </Alert>
            )}

            {taskAction === "move" && (
              <>
                <Select
                  label="Destination Project"
                  placeholder="Select destination project"
                  data={destinationOptions}
                  value={selectedDestinationId}
                  onChange={setSelectedDestinationId}
                  searchable
                  clearable
                  data-testid="select-destination-project"
                />

                {isCheckingConflicts && (
                  <Group gap="xs">
                    <Loader size="xs" />
                    <Text size="xs" c="dimmed">
                      Checking task comments...
                    </Text>
                  </Group>
                )}

                {selectedDestinationId && !isCheckingConflicts && (
                  <>
                    {conflictingComments.length > 0 ? (
                      <Alert
                        color="yellow"
                        variant="light"
                        data-testid="alert-conflicting-comments"
                      >
                        <Text fw={600} size="sm" mb="xs">
                          The following task comment
                          {conflictingComments.length === 1
                            ? " value already exists"
                            : " values already exist"}{" "}
                          in "{destinationProjectName}":
                        </Text>
                        <List
                          size="sm"
                          withPadding
                          mb="sm"
                          data-testid="conflicting-comments-list"
                        >
                          {conflictingComments.map((comment) => (
                            <List.Item
                              key={comment}
                              data-testid="conflicting-comment-item"
                            >
                              {comment}
                            </List.Item>
                          ))}
                        </List>
                        <Text fw={600} size="sm" mb="xs">
                          Do you really want to move the tasks?
                        </Text>
                        <Text
                          size="xs"
                          c="dimmed"
                          data-testid="rename-guidance-text"
                        >
                          Guidance: You can rename the tasks in the tasks
                          management page.
                        </Text>
                      </Alert>
                    ) : (
                      <Text
                        size="sm"
                        c="dimmed"
                        data-testid="text-no-conflicts"
                      >
                        All {taskCount} task{taskCount === 1 ? "" : "s"} will be
                        moved to "{destinationProjectName}".
                      </Text>
                    )}
                  </>
                )}
              </>
            )}

            <Group justify="flex-end" gap="sm">
              <Button
                variant="default"
                onClick={handleClose}
                data-testid="button-cancel-delete-project"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                color={taskAction === "delete" ? "red" : "blue"}
                onClick={handleConfirmDelete}
                data-testid="button-confirm-delete-project"
                loading={isDeleting}
                disabled={isMoveDisabled || isDeleting}
              >
                {taskAction === "delete"
                  ? "Delete Project and Tasks"
                  : "Move Tasks and Delete Project"}
              </Button>
            </Group>
          </Stack>
        )}
      </div>
    </Modal>
  );
}
