import { ProjectBudget } from "@/models/ProjectBudget";
import { useEffortumStore } from "@/store";
import {
  DEFAULT_WORKING_HOURS_PER_DAY,
  formatBudgetMetrics,
  MAX_BUDGET_PURPOSE_LENGTH,
  sortProjectBudgetsNewestFirst,
} from "@/utils/budget";
import {
  Button,
  Group,
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
    parsedHours > 0;

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
  const getProjectBookedTimeHours = useEffortumStore(
    (state) => state.getProjectBookedTimeHours,
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
  const [overallSpentHours, setOverallSpentHours] = useState(0);
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

  const overallBudgetedHours = useMemo(
    () => sortedProjectBudgets.reduce((sum, budget) => sum + budget.hours, 0),
    [sortedProjectBudgets],
  );

  useEffect(() => {
    if (projects.length === 0) {
      void loadFromIndexedDb();
    }
  }, [loadFromIndexedDb, projects.length]);

  useEffect(() => {
    let isCancelled = false;

    const loadSpentMetrics = async () => {
      if (!selectedProjectId) {
        setOverallSpentHours(0);
        setSpentHoursByBudgetId({});
        return;
      }

      const [projectTotalSpent, perBudgetEntries] = await Promise.all([
        getProjectBookedTimeHours(selectedProjectId),
        Promise.all(
          sortedProjectBudgets.map(async (budget) => {
            const spent = await getProjectBookedTimeHoursInRange(
              selectedProjectId,
              budget.startDate,
              budget.endDate,
            );
            return [budget.id, spent] as const;
          }),
        ),
      ]);

      if (isCancelled) {
        return;
      }

      setOverallSpentHours(projectTotalSpent);
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
    getProjectBookedTimeHours,
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

  const handleDeleteBudget = async (budgetId: string) => {
    if (isMutatingRef.current) {
      return;
    }

    isMutatingRef.current = true;
    setDeletingBudgetId(budgetId);

    try {
      await deleteProjectBudget(budgetId);
      clearDraft(budgetId);
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
            <Group justify="space-between" wrap="nowrap">
              <Text fw={600} size="sm">
                Overall Project Budget
              </Text>
              <Text
                fw={600}
                size="sm"
                style={{ fontVariantNumeric: "tabular-nums" }}
                data-testid="project-budget-overall-summary"
              >
                {formatBudgetMetrics(
                  overallSpentHours,
                  overallBudgetedHours,
                  workingHoursPerDay,
                )}
              </Text>
            </Group>
          </Paper>

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
                    style={{ flex: "1 1 0", minWidth: 120 }}
                  />
                  <NumberInput
                    size="xs"
                    aria-label="Hours"
                    min={0.25}
                    step={1}
                    allowNegative={false}
                    value={draft.hours}
                    onChange={(value) => updateDraft(budget, { hours: value })}
                    data-testid={`budget-hours-input-${budget.id}`}
                    w={100}
                  />
                  <Text
                    c="dimmed"
                    size="sm"
                    ta="right"
                    style={{
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
                    disabled={isSaveDisabled}
                    loading={savingBudgetId === budget.id}
                    onClick={() => handleSaveBudget(budget)}
                    data-testid={`button-save-budget-${budget.id}`}
                  >
                    Save
                  </Button>
                  <Button
                    size="xs"
                    color="red"
                    variant="light"
                    loading={deletingBudgetId === budget.id}
                    onClick={() => handleDeleteBudget(budget.id)}
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
    </Stack>
  );
}
