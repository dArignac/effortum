import { expect, test } from "@playwright/test";

test.describe("Task Stop and Start Prefill", () => {
  test("should properly prefill start time from last stopped task's end time", async ({
    page,
  }) => {
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

    // Wait for the task row to appear
    await expect(page.locator('[data-testid^="task-row-"]')).toHaveCount(1);

    // Now stop this task (this should set endTimeOfLastStoppedTask)
    const taskRows = page.locator('[data-testid^="task-row-"]');
    await expect(taskRows).toHaveCount(1, { timeout: 5000 });

    const stopButton = taskRows
      .first()
      .locator('[data-testid^="button-stop-task-"]');
    await expect(stopButton).toBeVisible();
    await stopButton.click();

    // Wait for the stop operation to complete and verify that we now have a stopped task
    await expect(stopButton).not.toBeVisible();

    const endTimeInput = taskRows.first().locator("td").nth(2).locator("input");
    const stoppedEndTime = await endTimeInput.inputValue();
    expect(stoppedEndTime).toMatch(/^\d{2}:\d{2}$/);

    // Create another new task - this should have start time prefilled from last stopped task's end time
    const startInput = page.getByTestId("add-entry-input-start-time");

    await expect(startInput).toBeVisible();
    await expect(startInput).toHaveValue(stoppedEndTime);
  });

  test("should handle task flow correctly from stop to new task creation", async ({
    page,
  }) => {
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

    // Wait for the task row to appear
    await expect(page.locator('[data-testid^="task-row-"]')).toHaveCount(1);

    // Now we have an incomplete task. Let's stop it.
    const taskRows = page.locator('[data-testid^="task-row-"]');
    await expect(taskRows).toHaveCount(1, { timeout: 5000 });

    const stopButton = taskRows
      .first()
      .locator('[data-testid^="button-stop-task-"]');
    await expect(stopButton).toBeVisible();
    await stopButton.click();

    // Wait for the stop operation to complete
    await expect(stopButton).not.toBeVisible();

    const endTimeInput = taskRows.first().locator("td").nth(2).locator("input");
    const stoppedEndTime = await endTimeInput.inputValue();
    expect(stoppedEndTime).toMatch(/^\d{2}:\d{2}$/);

    // Now create a new task - it should have start time prefilled from last stopped task's end time
    const newStartInput = page.getByTestId("add-entry-input-start-time");

    await expect(newStartInput).toBeVisible();
    await expect(newStartInput).toHaveValue(stoppedEndTime);

    // Complete adding the new task with the prefilled start time
    await page.getByTestId("add-entry-input-end-time").fill("23:59");
    await page.getByTestId("add-entry-input-project").fill("Second Project");
    await page.getByTestId("button-add-task").click();
    await expect(page.locator('[data-testid^="task-row-"]')).toHaveCount(2);
  });
});
