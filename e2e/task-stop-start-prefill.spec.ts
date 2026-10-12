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

  test("should prefill start time correctly when stopping consecutive tasks", async ({
    page,
  }) => {
    // Install clock at 14:20
    await page.clock.install({ time: new Date("2026-10-12T14:20:00") });
    await page.goto("/");

    await expect(page.getByTestId("task-list-table")).toBeVisible();

    const addButton = page.getByTestId("button-add-task");
    await expect(addButton).toBeVisible();

    // Task 1: start at 14:00, no end time
    await page.getByTestId("add-entry-input-start-time").fill("14:00");
    await page.getByTestId("add-entry-input-project").fill("Project A");
    await addButton.click();

    // Stop Task 1 at 14:20
    const taskRows = page.locator('[data-testid^="task-row-"]');
    await expect(taskRows).toHaveCount(1);
    const stopButton1 = taskRows
      .first()
      .locator('[data-testid^="button-stop-task-"]');
    await expect(stopButton1).toBeVisible();
    await stopButton1.click();
    await expect(stopButton1).not.toBeVisible();

    // The add entry input should have prefilled 14:20
    const startInput = page.getByTestId("add-entry-input-start-time");
    await expect(startInput).toBeVisible();
    await expect(startInput).toHaveValue("14:20");

    // Task 2: starts at 14:20, no end time
    await page.getByTestId("add-entry-input-project").fill("Project B");
    await addButton.click();

    // Now 2 tasks exist, task 2 is running
    await expect(taskRows).toHaveCount(2);

    // Fast-forward or advance clock to 14:45
    await page.clock.setFixedTime(new Date("2026-10-12T14:45:00"));

    // Stop Task 2 at 14:45
    const stopButton2 = page.locator('[data-testid^="button-stop-task-"]');
    await expect(stopButton2).toHaveCount(1);
    await stopButton2.click();
    await expect(stopButton2).not.toBeVisible();

    // Check prefilled start time for new entry
    await expect(startInput).toBeVisible();
    await expect(startInput).toHaveValue("14:45");
  });

  test("should prefill start time when an in-progress task is stopped by manually updating end time", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    const addButton = page.getByTestId("button-add-task");
    await expect(addButton).toBeVisible();

    // Start an in-progress task at 14:00
    await page.getByTestId("add-entry-input-start-time").fill("14:00");
    await page
      .getByTestId("add-entry-input-project")
      .fill("Manual Stop Project");
    await addButton.click();

    const taskRows = page.locator('[data-testid^="task-row-"]');
    await expect(taskRows).toHaveCount(1);

    // Instead of clicking Stop, manually enter 14:45 in the task's end time and click update
    const endTimeInput = taskRows.first().locator("td").nth(2).locator("input");
    await endTimeInput.fill("14:45");
    const updateButton = taskRows
      .first()
      .locator('[data-testid^="button-update-task-"]');
    await updateButton.click();

    // AddEntryRow should become visible and start time should be prefilled with 14:45
    const startInput = page.getByTestId("add-entry-input-start-time");
    await expect(startInput).toBeVisible();
    await expect(startInput).toHaveValue("14:45");
  });

  test("should update prefilled start time when the last stopped task's end time is manually adjusted", async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-10-12T14:20:00") });
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    const addButton = page.getByTestId("button-add-task");
    await expect(addButton).toBeVisible();

    // Start a task at 14:00
    await page.getByTestId("add-entry-input-start-time").fill("14:00");
    await page.getByTestId("add-entry-input-project").fill("Project Adjust");
    await addButton.click();

    const taskRows = page.locator('[data-testid^="task-row-"]');
    await expect(taskRows).toHaveCount(1);

    // Stop task at 14:20
    const stopButton = taskRows
      .first()
      .locator('[data-testid^="button-stop-task-"]');
    await stopButton.click();
    await expect(stopButton).not.toBeVisible();

    // Add entry row should have 14:20
    const startInput = page.getByTestId("add-entry-input-start-time");
    await expect(startInput).toBeVisible();
    await expect(startInput).toHaveValue("14:20");

    // Now manually adjust the stopped task's end time from 14:20 to 14:35
    const endTimeInput = taskRows.first().locator("td").nth(2).locator("input");
    await endTimeInput.fill("14:35");
    const updateButton = taskRows
      .first()
      .locator('[data-testid^="button-update-task-"]');
    await updateButton.click();

    // The add entry input should automatically reflect the adjusted end time (14:35)
    await expect(startInput).toHaveValue("14:35");
  });

  test("should not overwrite manually typed start time when a task is updated", async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-10-12T14:20:00") });
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    const addButton = page.getByTestId("button-add-task");
    await expect(addButton).toBeVisible();

    // Start a task at 14:00
    await page.getByTestId("add-entry-input-start-time").fill("14:00");
    await page.getByTestId("add-entry-input-project").fill("Project Preserve");
    await addButton.click();

    const taskRows = page.locator('[data-testid^="task-row-"]');
    await expect(taskRows).toHaveCount(1);

    // Stop task at 14:20
    const stopButton = taskRows
      .first()
      .locator('[data-testid^="button-stop-task-"]');
    await stopButton.click();
    await expect(stopButton).not.toBeVisible();

    const startInput = page.getByTestId("add-entry-input-start-time");
    await expect(startInput).toBeVisible();
    await expect(startInput).toHaveValue("14:20");

    // User manually types a custom start time, e.g. 13:00
    await startInput.fill("13:00");
    await expect(startInput).toHaveValue("13:00");

    // Manually adjust the stopped task's end time to 14:35
    const endTimeInput = taskRows.first().locator("td").nth(2).locator("input");
    await endTimeInput.fill("14:35");
    const updateButton = taskRows
      .first()
      .locator('[data-testid^="button-update-task-"]');
    await updateButton.click();

    // User's manual custom start time (13:00) should be preserved!
    await expect(startInput).toHaveValue("13:00");
  });
});
