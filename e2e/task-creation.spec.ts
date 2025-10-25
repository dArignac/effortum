import { test, expect } from "@playwright/test";

// felder einzeln testen, dann task creation, dann rest. KI ist überfordert. Muss es manuell tun.

test.describe("Task Creation", () => {
  test("should show validation errors for start and project fields if no value is given and task is added", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for the page to load - target the main task table specifically
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // Ensure Add button is visible
    const addButton = page.getByTestId("button-add-task");

    // If Add button is not visible, complete any incomplete task first
    const isAddButtonVisible = await addButton.isVisible();
    if (!isAddButtonVisible) {
      const emptyEndTimeInput = page.getByTestId("add-entry-input-end-time");
      if (await emptyEndTimeInput.isVisible()) {
        await emptyEndTimeInput.fill("17:00");
        await emptyEndTimeInput.blur();
        await expect(addButton).toBeVisible({ timeout: 5000 });
      }
    }

    // Try to add a task without required fields
    await addButton.click();

    // Should show a notification about validation errors
    await expect(
      page.locator(
        'text="Please fix validation errors before adding the task."',
      ),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByTestId("add-entry-input-start-time"),
    ).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("add-entry-input-project")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  test("should select date using date picker", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load - target the main task table specifically
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

    // Click on the date input to open the date picker
    const dateInput = page.getByTestId("add-entry-input-date");
    await expect(dateInput).toBeVisible();
    await dateInput.click();

    // Wait for the date picker to open - be more specific to avoid multiple matches
    const datePickerPopover = page
      .locator(".mantine-Popover-dropdown")
      .filter({ has: page.locator(".mantine-DatePickerInput-day") });
    await expect(datePickerPopover).toBeVisible();

    // Test selecting a specific date (e.g., 15th of current month)
    // First, let's try to find and click on day 15
    const day15 = page
      .locator(".mantine-DatePickerInput-day")
      .filter({ hasText: /^15$/ })
      .first();

    if (await day15.isVisible()) {
      await day15.click();
    } else {
      // If day 15 is not visible, click on any available day that's not outside the current month
      const availableDay = page
        .locator(".mantine-DatePickerInput-day:not([data-outside])")
        .first();
      await availableDay.click();
    }

    // Verify the date picker closes and a date is selected
    await expect(datePickerPopover).not.toBeVisible();

    // Verify that the input now has a value (should be in YYYY-MM-DD format)
    // For Mantine DatePickerInput, the value is displayed as text content
    const inputValue = await dateInput.textContent();
    expect(inputValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(inputValue).not.toBe("");

    // Test using preset buttons
    await dateInput.click();
    await expect(datePickerPopover).toBeVisible();

    // Click on "Today" preset
    const todayPreset = page
      .locator(".mantine-DatePickerInput-presetButton")
      .filter({ hasText: "Today" });
    await expect(todayPreset).toBeVisible();
    await todayPreset.click();

    // Verify the date picker closes and today's date is selected
    await expect(datePickerPopover).not.toBeVisible();

    const todayValue = await dateInput.textContent();
    const expectedToday = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    expect(todayValue).toBe(expectedToday);

    // Test "Yesterday" preset
    await dateInput.click();
    await expect(datePickerPopover).toBeVisible();

    const yesterdayPreset = page
      .locator(".mantine-DatePickerInput-presetButton")
      .filter({ hasText: "Yesterday" });
    await expect(yesterdayPreset).toBeVisible();
    await yesterdayPreset.click();

    await expect(datePickerPopover).not.toBeVisible();

    const yesterdayValue = await dateInput.textContent();
    const expectedYesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    expect(yesterdayValue).toBe(expectedYesterday);
  });

  test("should show newly added task in task list with correct button states", async ({
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

    // Fill in the required fields for a new task
    const startTimeInput = page.getByTestId("add-entry-input-start-time");
    const projectInput = page.getByTestId("add-entry-input-project");

    await startTimeInput.fill("09:00");
    await projectInput.fill("Test Project");

    // Add the task
    await addButton.click();

    // Wait for the task to appear in the list
    // The task row should be visible
    const taskRows = page.locator('[data-testid^="task-row-"]');
    await expect(taskRows).toHaveCount(1, { timeout: 5000 });

    const taskRow = taskRows.first();

    // Verify the task contains the correct data by checking specific cells
    // Check start time in the second column
    const startTimeCell = taskRow.locator("td").nth(1);
    await expect(startTimeCell.locator("input")).toHaveValue("09:00");

    // Check project in the fourth column
    const projectCell = taskRow.locator("td").nth(3);
    await expect(projectCell.locator("input")).toHaveValue("Test Project");

    // Check button states within this specific task row
    // Since we don't know the task ID, we'll find buttons within the task row
    const updateButton = taskRow.locator(
      '[data-testid^="button-update-task-"]',
    );
    const stopButton = taskRow.locator('[data-testid^="button-stop-task-"]');

    // Update button should be visible but disabled (no changes yet)
    await expect(updateButton).toBeVisible();
    await expect(updateButton).toBeDisabled();

    // Stop button should be visible and enabled (incomplete task)
    await expect(stopButton).toBeVisible();
    await expect(stopButton).toBeEnabled();

    // Verify that the task is incomplete (no end time filled in by default)
    const endTimeCell = taskRow.locator("td").nth(2);
    const endTimeInput = endTimeCell.locator("input");
    const endTimeValue = await endTimeInput.inputValue();
    expect(endTimeValue).toBe("");
  });

  test("should handle multiple tasks with unique button identifiers", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for the page to load
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // Ensure Add button is visible by completing any incomplete task first
    let addButton = page.getByTestId("button-add-task");
    let isAddButtonVisible = await addButton.isVisible();

    if (!isAddButtonVisible) {
      const emptyEndTimeInput = page.getByTestId("add-entry-input-end-time");
      if (await emptyEndTimeInput.isVisible()) {
        await emptyEndTimeInput.fill("17:00");
        await emptyEndTimeInput.blur();
        await expect(addButton).toBeVisible({ timeout: 5000 });
      }
    }

    // Add first task
    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").fill("10:00");
    await page.getByTestId("add-entry-input-project").fill("Project A");
    await addButton.click();

    // Wait for add button to be visible again (first task is complete)
    await expect(addButton).toBeVisible({ timeout: 5000 });

    // Add second task (incomplete)
    await page.getByTestId("add-entry-input-start-time").fill("11:00");
    await page.getByTestId("add-entry-input-end-time").clear(); // Leave empty for incomplete task
    await page.getByTestId("add-entry-input-project").fill("Project B");
    await addButton.click();

    // Should have 2 task rows now
    const taskRows = page.locator('[data-testid^="task-row-"]');
    await expect(taskRows).toHaveCount(2, { timeout: 5000 });

    // Check first task (complete) - should have update button but no stop button
    const firstTaskRow = taskRows.first();
    const firstUpdateButton = firstTaskRow.locator(
      '[data-testid^="button-update-task-"]',
    );
    const firstStopButton = firstTaskRow.locator(
      '[data-testid^="button-stop-task-"]',
    );

    await expect(firstUpdateButton).toBeVisible();
    await expect(firstUpdateButton).toBeDisabled(); // No changes made
    await expect(firstStopButton).not.toBeVisible(); // Complete task has no stop button

    // Check second task (incomplete) - should have both update and stop buttons
    const secondTaskRow = taskRows.nth(1);
    const secondUpdateButton = secondTaskRow.locator(
      '[data-testid^="button-update-task-"]',
    );
    const secondStopButton = secondTaskRow.locator(
      '[data-testid^="button-stop-task-"]',
    );

    await expect(secondUpdateButton).toBeVisible();
    await expect(secondUpdateButton).toBeDisabled(); // No changes made
    await expect(secondStopButton).toBeVisible(); // Incomplete task has stop button
    await expect(secondStopButton).toBeEnabled();

    // Verify buttons have different data-testid values
    const firstUpdateId = await firstUpdateButton.getAttribute("data-testid");
    const secondUpdateId = await secondUpdateButton.getAttribute("data-testid");
    const secondStopId = await secondStopButton.getAttribute("data-testid");

    expect(firstUpdateId).toMatch(/^button-update-task-/);
    expect(secondUpdateId).toMatch(/^button-update-task-/);
    expect(secondStopId).toMatch(/^button-stop-task-/);
    expect(firstUpdateId).not.toBe(secondUpdateId); // Should be different
  });
});
