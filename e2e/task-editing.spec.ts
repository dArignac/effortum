import { expect, Page, test } from "@playwright/test";
import { ensureAddButtonIsVisible } from "./utils";

async function addTask(
  page: Page,
  projectName: string,
  comment: string,
  startTime: string,
  endTime: string,
) {
  await ensureAddButtonIsVisible(page);

  await page.getByTestId("add-entry-input-start-time").fill(startTime);
  await page.getByTestId("add-entry-input-end-time").fill(endTime);
  await page.getByTestId("add-entry-input-project").fill(projectName);
  if (comment) {
    await page.getByTestId("add-entry-input-comment").fill(comment);
  }
  await page.getByTestId("button-add-task").click();
  await expect(page.getByTestId("button-add-task")).toBeVisible({
    timeout: 5000,
  });
}

async function addRunningTask(
  page: Page,
  projectName: string,
  startTime: string,
) {
  await ensureAddButtonIsVisible(page);

  await page.getByTestId("add-entry-input-start-time").fill(startTime);
  await page.getByTestId("add-entry-input-end-time").fill("");
  await page.getByTestId("add-entry-input-project").fill(projectName);
  await page.getByTestId("button-add-task").click();

  // Running task means AddEntryRow disappears; wait for task row to appear instead
  await expect(page.locator('[data-testid^="task-row-"]').last()).toBeVisible({
    timeout: 5000,
  });
}

test.describe("Task Editing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
  });

  test("should enable update button only when changes are made", async ({
    page,
  }) => {
    await addTask(page, "EditProject", "", "09:00", "10:00");

    const taskRow = page.locator('[data-testid^="task-row-"]').first();
    await expect(taskRow).toBeVisible();

    const updateButton = taskRow.locator(
      '[data-testid^="button-update-task-"]',
    );
    await expect(updateButton).toBeDisabled();

    // Change start time
    await taskRow.locator("td").nth(1).locator("input").fill("08:30");
    await expect(updateButton).toBeEnabled();
  });

  test("should update task start and end time and persist after reload", async ({
    page,
  }) => {
    await addTask(page, "EditProject", "", "09:00", "10:00");

    const taskRow = page.locator('[data-testid^="task-row-"]').first();
    await expect(taskRow).toBeVisible();

    // Change start and end time
    await taskRow.locator("td").nth(1).locator("input").fill("08:30");
    await taskRow.locator("td").nth(2).locator("input").fill("11:00");

    // Click update
    const updateButton = taskRow.locator(
      '[data-testid^="button-update-task-"]',
    );
    await updateButton.click();

    await expect(page.getByText("Task updated successfully!")).toBeVisible();

    // Reload and verify
    await page.reload();
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    const reloadedRow = page.locator('[data-testid^="task-row-"]').first();
    await expect(reloadedRow.locator("td").nth(1).locator("input")).toHaveValue(
      "08:30",
    );
    await expect(reloadedRow.locator("td").nth(2).locator("input")).toHaveValue(
      "11:00",
    );
  });

  test("should update task project and persist after reload", async ({
    page,
  }) => {
    await addTask(page, "ProjectX", "", "09:00", "10:00");

    const taskRow = page.locator('[data-testid^="task-row-"]').first();
    await expect(taskRow).toBeVisible();

    // Change project
    const projectInput = taskRow.locator("td").nth(3).locator("input");
    await projectInput.clear();
    await projectInput.fill("ProjectY");

    const updateButton = taskRow.locator(
      '[data-testid^="button-update-task-"]',
    );
    await updateButton.click();

    await expect(page.getByText("Task updated successfully!")).toBeVisible();

    // Reload and verify
    await page.reload();
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    const reloadedRow = page.locator('[data-testid^="task-row-"]').first();
    await expect(reloadedRow.locator("td").nth(3).locator("input")).toHaveValue(
      "ProjectY",
    );
  });

  test("should update task comment and persist after reload", async ({
    page,
  }) => {
    await addTask(page, "CommentProject", "initial comment", "09:00", "10:00");

    const taskRow = page.locator('[data-testid^="task-row-"]').first();
    await expect(taskRow).toBeVisible();

    // Change comment
    const commentInput = taskRow.locator("td").nth(4).locator("input");
    await commentInput.clear();
    await commentInput.fill("updated comment");

    const updateButton = taskRow.locator(
      '[data-testid^="button-update-task-"]',
    );
    await updateButton.click();

    await expect(page.getByText("Task updated successfully!")).toBeVisible();

    // Reload and verify
    await page.reload();
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    const reloadedRow = page.locator('[data-testid^="task-row-"]').first();
    await expect(reloadedRow.locator("td").nth(4).locator("input")).toHaveValue(
      "updated comment",
    );
  });

  test("should show validation error when setting end time before start time", async ({
    page,
  }) => {
    await addTask(page, "ValidationProject", "", "09:00", "10:00");

    const taskRow = page.locator('[data-testid^="task-row-"]').first();
    await expect(taskRow).toBeVisible();

    // Set end time before start time
    await taskRow.locator("td").nth(2).locator("input").fill("08:00");

    const updateButton = taskRow.locator(
      '[data-testid^="button-update-task-"]',
    );
    await updateButton.click();

    await expect(
      page.getByText("Please fix validation errors before updating the task."),
    ).toBeVisible();
  });

  test("should update task date using date picker and reflect in date filter", async ({
    page,
  }) => {
    await addTask(page, "DateChangeProject", "initial task", "09:00", "10:00");

    const taskRow = page.locator('[data-testid^="task-row-"]').first();
    await expect(taskRow).toBeVisible();

    // Click date picker on the task row
    const dateField = taskRow.locator('[data-testid^="date-selection-"]');
    await dateField.click();

    // Select "Yesterday" preset
    const yesterdayPreset = page
      .locator(".mantine-DatePickerInput-presetButton")
      .filter({ hasText: "Yesterday" });
    await yesterdayPreset.click();

    // Update button should be enabled
    const updateButton = taskRow.locator(
      '[data-testid^="button-update-task-"]',
    );
    await expect(updateButton).toBeEnabled();
    await updateButton.click();

    await expect(page.getByText("Task updated successfully!")).toBeVisible();

    // Because calendar is currently set to Today, yesterday's task is no longer in today's view
    await expect(page.locator('[data-testid^="task-row-"]')).toHaveCount(0);

    // Now select yesterday in the calendar
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIso = yesterday.toISOString().split("T")[0];

    await page.getByTestId(`summary-date-day-${yesterdayIso}`).click();
    await page.getByTestId(`summary-date-day-${yesterdayIso}`).click();

    // Task should now be visible under yesterday
    await expect(page.locator('[data-testid^="task-row-"]')).toHaveCount(1);
    await expect(
      page
        .locator('[data-testid^="task-row-"]')
        .first()
        .locator("td")
        .nth(3)
        .locator("input"),
    ).toHaveValue("DateChangeProject");
  });

  test("should show validation error when clearing start time or project on task edit", async ({
    page,
  }) => {
    await addTask(page, "RequiredFieldsProject", "", "09:00", "10:00");

    const taskRow = page.locator('[data-testid^="task-row-"]').first();
    await expect(taskRow).toBeVisible();

    // Clear start time
    await taskRow.locator("td").nth(1).locator("input").clear();
    const updateButton = taskRow.locator(
      '[data-testid^="button-update-task-"]',
    );
    await expect(updateButton).toBeEnabled();
    await updateButton.click();

    await expect(
      page
        .getByText("Please fix validation errors before updating the task.")
        .first(),
    ).toBeVisible();

    // Restore start time and clear project
    await taskRow.locator("td").nth(1).locator("input").fill("09:00");
    await taskRow.locator("td").nth(3).locator("input").clear();
    await updateButton.click();

    await expect(
      page.getByText("Please fix validation errors before updating the task."),
    ).toHaveCount(2);
  });

  test("should stop a running task and set end time", async ({ page }) => {
    await addRunningTask(page, "RunningProject", "00:01");

    const taskRow = page.locator('[data-testid^="task-row-"]').first();
    await expect(taskRow).toBeVisible();

    // Verify stop button is visible
    const stopButton = taskRow.locator('[data-testid^="button-stop-task-"]');
    await expect(stopButton).toBeVisible();

    // Stop the task
    await stopButton.click();

    // Stop button should disappear
    await expect(stopButton).not.toBeVisible();

    // End time should now have a value
    const endTimeInput = taskRow.locator("td").nth(2).locator("input");
    const endTimeValue = await endTimeInput.inputValue();
    expect(endTimeValue).toMatch(/^\d{2}:\d{2}$/);
  });
});
