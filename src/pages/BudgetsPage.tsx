import { ProjectBudget } from "@/models/ProjectBudget";
import { useEffortumStore } from "@/store";
import {
  DEFAULT_WORKING_HOURS_PER_DAY,
  formatBudgetMetrics,
  MAX_BUDGET_HOURS,
  MAX_BUDGET_PURPOSE_LENGTH,
  sortProjectBudgetsNewestFirst,
} from "@/utils/budget";
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";

type BudgetDraft = {
  startDate: string;
  endDate: string;
  purpose: string;
  hours: number | string;
};

function toBudgetDraft(budget: ProjectBudget): BudgetDraft {
  return {
    startDate: budget.startDate,
    endDate: budget.endDate,
    purpose: budget.purpose,
    hours: budget.hours,
  };
}

function canSaveBudgetDraft(
  budget: ProjectBudget,
  draft: BudgetDraft,
): boolean {
  const trimmedPurpose = draft.purpose.trim();
  const parsedHours = Number(draft.hours);

  const hasChanges =
    draft.startDate !== budget.startDate ||
    draft.endDate !== budget.endDate ||
    trimmedPurpose !== budget.purpose ||
    parsedHours !== budget.hours;

  const isValid =
    Boolean(draft.startDate) &&
    Boolean(draft.endDate) &&
    trimmedPurpose.length > 0 &&
    trimmedPurpose.length <= MAX_BUDGET_PURPOSE_LENGTH &&
    Number.isFinite(parsedHours) &&
    parsedHours > 0 &&
    parsedHours <= MAX_BUDGET_HOURS;

  return hasChanges && isValid;
}

function getBudgetErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  switch (error.message) {
    case "BUDGET_DATES_REQUIRED":
      return "Start and end dates are required.";
    case "BUDGET_END_BEFORE_START":
      return "End date must not be before start date.";
    case "BUDGET_PURPOSE_REQUIRED":
      return "Purpose is required.";
    case "BUDGET_PURPOSE_TOO_LONG":
      return `Purpose must be at most ${MAX_BUDGET_PURPOSE_LENGTH} characters.`;
    case "BUDGET_HOURS_INVALID":
      return "Budget hours must be greater than 0.";
    case "BUDGET_HOURS_TOO_HIGH":
      return `Budget hours must be at most ${MAX_BUDGET_HOURS}.`;
    default:
      return fallback;
  }
}

export function BudgetsPage() {
  const projects = useEffortumStore((state) => state.projects);
  const budgets = useEffortumStore((state) => state.budgets);
  const tasks = useEffortumStore((state) => state.tasks);
  const workingHoursPerDay = useEffortumStore(
    (state) =>
      state.overtime.at(0)?.workingHoursPerDay ?? DEFAULT_WORKING_HOURS_PER_DAY,
  );
  const loadFromIndexedDb = useEffortumStore(
    (state) => state.loadFromIndexedDb,
  );
  const addProjectBudget = useEffortumStore((state) => state.addProjectBudget);
  const updateProjectBudget = useEffortumStore(
    (state) => state.updateProjectBudget,
  );
  const deleteProjectBudget = useEffortumStore(
    (state) => state.deleteProjectBudget,
  );
  const getProjectBookedTimeHoursInRange = useEffortumStore(
    (state) => state.getProjectBookedTimeHoursInRange,
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [newStartDate, setNewStartDate] = useState(() =>
    dayjs().startOf("month").format("YYYY-MM-DD"),
  );
  const [newEndDate, setNewEndDate] = useState(() =>
    dayjs().endOf("month").format("YYYY-MM-DD"),
  );
  const [newPurpose, setNewPurpose] = useState("");
  const [newHours, setNewHours] = useState<number | string>("");
  const [isAdding, setIsAdding] = useState(false);

  const [editedBudgets, setEditedBudgets] = useState<
    Record<string, BudgetDraft>
  >({});
  const [savingBudgetId, setSavingBudgetId] = useState<string | null>(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<ProjectBudget | null>(
    null,
  );
  const [spentHoursByBudgetId, setSpentHoursByBudgetId] = useState<
    Record<string, number>
  >({});

  const isMutatingRef = useRef(false);

  const projectOptions = useMemo(
    () =>
      projects
        .map((project) => ({ value: project.id, label: project.name }))
        .sort((a, b) =>
          a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
        ),
    [projects],
  );

  const sortedProjectBudgets = useMemo(() => {
    if (!selectedProjectId) {
      return [];
    }
    return sortProjectBudgetsNewestFirst(
      budgets.filter((budget) => budget.projectId === selectedProjectId),
    );
  }, [budgets, selectedProjectId]);

  useEffect(() => {
    if (projects.length === 0) {
      void loadFromIndexedDb();
    }
  }, [loadFromIndexedDb, projects.length]);

  useEffect(() => {
    let isCancelled = false;

    const loadSpentMetrics = async () => {
      if (!selectedProjectId) {
        setSpentHoursByBudgetId({});
        return;
      }

      const perBudgetEntries = await Promise.all(
        sortedProjectBudgets.map(async (budget) => {
          const spent = await getProjectBookedTimeHoursInRange(
            selectedProjectId,
            budget.startDate,
            budget.endDate,
          );
          return [budget.id, spent] as const;
        }),
      );

      if (isCancelled) {
        return;
      }

      setSpentHoursByBudgetId(Object.fromEntries(perBudgetEntries));
    };

    void loadSpentMetrics();

    return () => {
      isCancelled = true;
    };
  }, [
    selectedProjectId,
    sortedProjectBudgets,
    tasks,
    getProjectBookedTimeHoursInRange,
  ]);

  const clearDraft = (budgetId: string) => {
    setEditedBudgets((current) => {
      const next = { ...current };
      delete next[budgetId];
      return next;
    });
  };

  const updateDraft = (budget: ProjectBudget, patch: Partial<BudgetDraft>) => {
    setEditedBudgets((current) => ({
      ...current,
      [budget.id]: {
        ...(current[budget.id] ?? toBudgetDraft(budget)),
        ...patch,
      },
    }));
  };

  const handleAddBudget = async () => {
    if (!selectedProjectId || isMutatingRef.current) {
      return;
    }

    isMutatingRef.current = true;
    setIsAdding(true);

    try {
      await addProjectBudget({
        projectId: selectedProjectId,
        startDate: newStartDate,
        endDate: newEndDate,
        purpose: newPurpose,
        hours: Number(newHours),
      });

      setNewPurpose("");
      setNewHours("");
      notifications.show({
        message: "Budget added successfully!",
        color: "green",
        "data-testid": "toast-budget-add-success",
      });
    } catch (error) {
      notifications.show({
        message: getBudgetErrorMessage(
          error,
          "Failed to add budget. Please try again.",
        ),
        color: "red",
        "data-testid": "toast-budget-add-error",
      });
    } finally {
      isMutatingRef.current = false;
      setIsAdding(false);
    }
  };

  const handleSaveBudget = async (budget: ProjectBudget) => {
    if (isMutatingRef.current) {
      return;
    }

    const draft = editedBudgets[budget.id];
    if (!draft) {
      return;
    }

    isMutatingRef.current = true;
    setSavingBudgetId(budget.id);

    try {
      await updateProjectBudget(budget.id, {
        startDate: draft.startDate,
        endDate: draft.endDate,
        purpose: draft.purpose,
        hours: Number(draft.hours),
      });
      clearDraft(budget.id);
      notifications.show({
        message: "Budget updated successfully!",
        color: "green",
        "data-testid": "toast-budget-update-success",
      });
    } catch (error) {
      notifications.show({
        message: getBudgetErrorMessage(
          error,
          "Failed to update budget. Please try again.",
        ),
        color: "red",
        "data-testid": "toast-budget-update-error",
      });
    } finally {
      isMutatingRef.current = false;
      setSavingBudgetId(null);
    }
  };

  const handleConfirmDeleteBudget = async (budgetId: string) => {
    if (isMutatingRef.current) {
      return;
    }

    isMutatingRef.current = true;
    setDeletingBudgetId(budgetId);

    try {
      await deleteProjectBudget(budgetId);
      clearDraft(budgetId);
      setBudgetToDelete(null);
      notifications.show({
        message: "Budget deleted successfully!",
        color: "green",
        "data-testid": "toast-budget-delete-success",
      });
    } catch {
      notifications.show({
        message: "Failed to delete budget. Please try again.",
        color: "red",
        "data-testid": "toast-budget-delete-error",
      });
    } finally {
      isMutatingRef.current = false;
      setDeletingBudgetId(null);
    }
  };

  return (
    <Stack data-testid="budgets-page" gap="md">
      <Text fw={700}>Budget Management</Text>

      <Select
        data-testid="budget-project-select"
        label="Project"
        placeholder="Select project"
        data={projectOptions}
        value={selectedProjectId}
        onChange={setSelectedProjectId}
        searchable
        clearable
      />

      {!selectedProjectId && (
        <Text c="dimmed" data-testid="budgets-no-project-selected">
          Select a project to manage budgets.
        </Text>
      )}

      {selectedProjectId && (
        <>
          <Paper withBorder p="sm" radius="sm">
            <Stack gap="xs">
              <Text fw={600} size="sm">
                Add Budget
              </Text>
              <Group align="flex-end" wrap="wrap" gap="sm">
                <TextInput
                  type="date"
                  label="Start Date"
                  value={newStartDate}
                  onChange={(event) =>
                    setNewStartDate(event.currentTarget.value)
                  }
                  data-testid="add-budget-start-date"
                  w={150}
                />
                <TextInput
                  type="date"
                  label="End Date"
                  value={newEndDate}
                  onChange={(event) => setNewEndDate(event.currentTarget.value)}
                  data-testid="add-budget-end-date"
                  w={150}
                />
                <TextInput
                  label="Purpose"
                  placeholder="Max. 50 characters"
                  maxLength={MAX_BUDGET_PURPOSE_LENGTH}
                  value={newPurpose}
                  onChange={(event) => setNewPurpose(event.currentTarget.value)}
                  data-testid="add-budget-purpose"
                  style={{ flex: "1 1 200px" }}
                />
                <NumberInput
                  label="Hours"
                  placeholder="0"
                  min={0.25}
                  max={MAX_BUDGET_HOURS}
                  clampBehavior="none"
                  step={1}
                  allowNegative={false}
                  value={newHours}
                  onChange={setNewHours}
                  data-testid="add-budget-hours"
                  w={120}
                />
                <Button
                  onClick={handleAddBudget}
                  loading={isAdding}
                  data-testid="button-add-budget"
                >
                  Add Budget
                </Button>
              </Group>
            </Stack>
          </Paper>

          <Text fw={700} data-testid="budgets-list-label">
            Project Budgets
          </Text>

          {sortedProjectBudgets.length === 0 ? (
            <Text c="dimmed" data-testid="budgets-empty-state">
              No budgets defined for this project yet.
            </Text>
          ) : (
            sortedProjectBudgets.map((budget) => {
              const draft = editedBudgets[budget.id] ?? toBudgetDraft(budget);
              const isBusy =
                savingBudgetId !== null || deletingBudgetId !== null;
              const isSaveDisabled =
                isBusy || !canSaveBudgetDraft(budget, draft);

              return (
                <Group
                  key={budget.id}
                  wrap="nowrap"
                  w="100%"
                  data-testid={`budget-row-${budget.id}`}
                >
                  <TextInput
                    type="date"
                    size="xs"
                    aria-label="Start Date"
                    value={draft.startDate}
                    onChange={(event) =>
                      updateDraft(budget, {
                        startDate: event.currentTarget.value,
                      })
                    }
                    data-testid={`budget-start-date-input-${budget.id}`}
                    w={135}
                    style={{ flex: "0 0 135px" }}
                  />
                  <TextInput
                    type="date"
                    size="xs"
                    aria-label="End Date"
                    value={draft.endDate}
                    onChange={(event) =>
                      updateDraft(budget, {
                        endDate: event.currentTarget.value,
                      })
                    }
                    data-testid={`budget-end-date-input-${budget.id}`}
                    w={135}
                    style={{ flex: "0 0 135px" }}
                  />
                  <TextInput
                    size="xs"
                    aria-label="Purpose"
                    maxLength={MAX_BUDGET_PURPOSE_LENGTH}
                    value={draft.purpose}
                    onChange={(event) =>
                      updateDraft(budget, {
                        purpose: event.currentTarget.value,
                      })
                    }
                    data-testid={`budget-purpose-input-${budget.id}`}
                    style={{ flex: "1 1 0", minWidth: 0 }}
                  />
                  <NumberInput
                    size="xs"
                    aria-label="Hours"
                    min={0.25}
                    max={MAX_BUDGET_HOURS}
                    clampBehavior="none"
                    step={1}
                    allowNegative={false}
                    value={draft.hours}
                    onChange={(value) => updateDraft(budget, { hours: value })}
                    data-testid={`budget-hours-input-${budget.id}`}
                    w={100}
                    style={{ flex: "0 0 100px" }}
                  />
                  <Text
                    c="dimmed"
                    size="sm"
                    ta="right"
                    w={260}
                    style={{
                      flex: "0 0 260px",
                      whiteSpace: "nowrap",
                      fontVariantNumeric: "tabular-nums",
                    }}
                    data-testid={`budget-metrics-${budget.id}`}
                  >
                    {formatBudgetMetrics(
                      spentHoursByBudgetId[budget.id] ?? 0,
                      budget.hours,
                      workingHoursPerDay,
                    )}
                  </Text>
                  <Button
                    size="xs"
                    w={72}
                    style={{ flex: "0 0 72px" }}
                    disabled={isSaveDisabled}
                    loading={savingBudgetId === budget.id}
                    onClick={() => handleSaveBudget(budget)}
                    data-testid={`button-save-budget-${budget.id}`}
                  >
                    Save
                  </Button>
                  <Button
                    size="xs"
                    w={72}
                    style={{ flex: "0 0 72px" }}
                    color="red"
                    variant="light"
                    disabled={isBusy}
                    loading={deletingBudgetId === budget.id}
                    onClick={() => setBudgetToDelete(budget)}
                    data-testid={`button-delete-budget-${budget.id}`}
                  >
                    Delete
                  </Button>
                </Group>
              );
            })
          )}
        </>
      )}

      <Modal
        opened={budgetToDelete !== null}
        onClose={() => !deletingBudgetId && setBudgetToDelete(null)}
        title="Delete Budget"
        closeOnClickOutside={!deletingBudgetId}
        closeOnEscape={!deletingBudgetId}
      >
        {budgetToDelete && (
          <Stack gap="md" data-testid="modal-delete-budget">
            <Text size="sm">
              Are you sure you want to delete budget{" "}
              <Text span fw={700}>
                "{budgetToDelete.purpose}"
              </Text>{" "}
              ({budgetToDelete.startDate} – {budgetToDelete.endDate})? This
              action cannot be undone.
            </Text>
            <Group justify="flex-end" gap="sm">
              <Button
                variant="default"
                onClick={() => setBudgetToDelete(null)}
                disabled={deletingBudgetId !== null}
                data-testid="button-cancel-delete-budget"
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={() => handleConfirmDeleteBudget(budgetToDelete.id)}
                loading={deletingBudgetId === budgetToDelete.id}
                data-testid="button-confirm-delete-budget"
              >
                Delete Budget
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
