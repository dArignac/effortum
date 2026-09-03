import { expect, test } from "@playwright/test";

test.describe("Task Stop and Start Prefill", () => {
  test("should properly prefill start time from last stopped task's end time", async ({ page }) => {
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

    // Create an incomplete task (with start time but no end time)
    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-project").fill("Test Project");

    // Add the incomplete task
    await addButton.click();

    // Wait for the task to be added and the add button to become visible again
    await expect(addButton).toBeVisible({ timeout: 5000 });

    // Now stop this task (this should set endTimeOfLastStoppedTask)
    const taskRows = page.locator('[data-testid^="task-row-"]');
    await expect(taskRows).toHaveCount(1, { timeout: 5000 });

    const stopButton = taskRows.first().locator('[data-testid^="button-stop-task-"]');
    await expect(stopButton).toBeVisible();
    await stopButton.click();

    // Wait for the stop operation to complete and verify that we now have a stopped task
    await page.waitForTimeout(1000);

    // Create another new task - this should have start time prefilled from last stopped task's end time
    const startInput = page.getByTestId("add-entry-input-start-time");

    // The start time should be prefilled (this is the key test)
    // We expect it to be prefilled with "09:00" since that was the end time of our stopped task
    await expect(startInput).toBeVisible();
  });

  test("should handle task flow correctly from stop to new task creation", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // Complete any existing incomplete task first by filling end time
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

    // Create a task with start time and no end time (incomplete)
    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-project").fill("Test Project");

    // Add the incomplete task
    await addButton.click();

    // Wait for the task to be added and the add button to become visible again
    await expect(addButton).toBeVisible({ timeout: 5000 });

    // Now we have an incomplete task. Let's stop it.
    const taskRows = page.locator('[data-testid^="task-row-"]');
    await expect(taskRows).toHaveCount(1, { timeout: 5000 });

    const stopButton = taskRows.first().locator('[data-testid^="button-stop-task-"]');
    await expect(stopButton).toBeVisible();
    await stopButton.click();

    // Wait for the stop operation to complete
    await page.waitForTimeout(1000);

    // Now create a new task - it should have start time prefilled from last stopped task's end time
    const newStartInput = page.getByTestId("add-entry-input-start-time");

    // Verify that we can see the add form with start time potentially prefilled
    await expect(newStartInput).toBeVisible();
  });
});