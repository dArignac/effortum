import { expect, test } from "@playwright/test";

test.describe("Task Creation Reliability", () => {
  test("should create tasks with proper time handling when saving entries", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // Ensure Add button is visible by completing any incomplete task first
    const addButton = page.getByTestId("button-add-task");
    const isAddButtonVisible = await addButton.isVisible();

    if (!isAddButtonVisible) {
      const emptyEndTimeInput = page.getByTestId("add-entry-input-end-time");
      if (await emptyEndTimeInput.isVisible()) {
        await emptyEndTimeInput.fill("17:00");
        await emptyEndTimeInput.blur();
        await expect(addButton).toBeVisible({ timeout: 5000 });
      }
    }

    // Fill in task details
    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-project").fill("Test Project");

    // Add the task without explicitly setting end time
    await addButton.click();

    // Wait for the task to appear in the list
    const taskRows = page.locator('[data-testid^="task-row-"]');
    await expect(taskRows).toHaveCount(1, { timeout: 5000 });

    // Verify the task was created properly with start time but no end time
    const firstTaskRow = taskRows.first();
    const startTimeCell = firstTaskRow.locator("td").nth(1);
    const projectCell = firstTaskRow.locator("td").nth(3);
    const endTimeCell = firstTaskRow.locator("td").nth(2);

    // Verify start time is correct
    await expect(startTimeCell.locator("input")).toHaveValue("09:00");

    // Verify project is correct
    await expect(projectCell.locator("input")).toHaveValue("Test Project");

    // Verify end time is empty (as expected for incomplete task)
    const endTimeInput = endTimeCell.locator("input");
    const endTimeValue = await endTimeInput.inputValue();
    expect(endTimeValue).toBe("");
  });

  test("should properly handle task creation with explicit end time", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // Ensure Add button is visible by completing any incomplete task first
    const addButton = page.getByTestId("button-add-task");
    const isAddButtonVisible = await addButton.isVisible();

    if (!isAddButtonVisible) {
      const emptyEndTimeInput = page.getByTestId("add-entry-input-end-time");
      if (await emptyEndTimeInput.isVisible()) {
        await emptyEndTimeInput.fill("17:00");
        await emptyEndTimeInput.blur();
        await expect(addButton).toBeVisible({ timeout: 5000 });
      }
    }

    // Fill in task details with explicit end time
    await page.getByTestId("add-entry-input-start-time").fill("10:00");
    await page.getByTestId("add-entry-input-end-time").fill("11:00");
    await page.getByTestId("add-entry-input-project").fill("Test Project 2");

    // Add the task
    await addButton.click();

    // Wait for the task to appear in the list
    const taskRows = page.locator('[data-testid^="task-row-"]');
    await expect(taskRows).toHaveCount(1, { timeout: 5000 });

    // Verify the task was created properly with both start and end times
    const firstTaskRow = taskRows.first();
    const startTimeCell = firstTaskRow.locator("td").nth(1);
    const endTimeCell = firstTaskRow.locator("td").nth(2);

    // Verify start time is correct
    await expect(startTimeCell.locator("input")).toHaveValue("10:00");

    // Verify end time is correct
    await expect(endTimeCell.locator("input")).toHaveValue("11:00");
  });
});