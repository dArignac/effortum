import { test, expect } from "@playwright/test";

test.describe("Task Creation", () => {
  // test("should create a new task successfully", async ({ page }) => {
  //   // Navigate to the application
  //   await page.goto("/");

  //   // Wait for the page to load - target the main task table specifically
  //   await expect(page.locator("table.mantine-Table-table")).toBeVisible();

  //   // Check if the Add button is visible (only shows when no incomplete tasks exist)
  //   const addButton = page.getByTestId("button-add-task");

  //   // If Add button is not visible, it means there's an incomplete task
  //   // We need to complete it first by adding an end time
  //   const isAddButtonVisible = await addButton.isVisible();

  //   if (!isAddButtonVisible) {
  //     // Find the first row with an empty end time and fill it
  //     const emptyEndTimeInput = page.getByTestId("add-entry-input-end-time");
  //     if (await emptyEndTimeInput.isVisible()) {
  //       await emptyEndTimeInput.fill("17:00");
  //       await emptyEndTimeInput.blur(); // Trigger validation

  //       // Wait for the Add button to appear
  //       await expect(addButton).toBeVisible({ timeout: 5000 });
  //     }
  //   }

  //   // Now proceed with creating a new task
  //   await expect(addButton).toBeVisible();

  //   // Fill in the task details in the add entry row
  //   // Date field (DatePickerInput with "Pick date" placeholder)
  //   const dateInput = page.getByTestId("add-entry-input-date");
  //   await expect(dateInput).toBeVisible();
  //   await dateInput.click();
  //   // FIXME needs to click the calendar
  //   await dateInput.fill("2024-08-20");

  //   // Start time (TimeInput)
  //   const startTimeInput = page.getByTestId("add-entry-input-start-time");
  //   await startTimeInput.fill("09:00");

  //   // End time (TimeInput)
  //   const endTimeInput = page.getByTestId("add-entry-input-end-time");
  //   await endTimeInput.fill("17:00");

  //   // Project field (Autocomplete)
  //   const projectInput = page.getByTestId("add-entry-input-project");
  //   await projectInput.fill("Test Project");

  //   // Comment field
  //   const commentInput = page.getByTestId("add-entry-input-comment");
  //   await commentInput.fill("E2E test task");

  //   // Get the initial number of task rows
  //   const initialTaskRows = await page.locator("table tbody tr").count();

  //   // Click the Add button
  //   await addButton.click();

  //   // Wait for the task to be added
  //   await page.waitForTimeout(1000); // Give time for the task to be processed

  //   // Verify the task was added by checking if there's one more row
  //   const finalTaskRows = await page.locator("table tbody tr").count();
  //   expect(finalTaskRows).toBeGreaterThan(initialTaskRows);

  //   // Verify the task appears in the table with correct data
  //   const taskRows = page.locator("table tbody tr");

  //   // Look for a row containing our test data
  //   const testTaskRow = taskRows
  //     .filter({
  //       has: page.locator('text="Test Project"'),
  //     })
  //     .filter({
  //       has: page.locator('text="E2E test task"'),
  //     });

  //   await expect(testTaskRow).toBeVisible();

  //   // Verify the time fields are displayed correctly
  //   await expect(testTaskRow.locator('text="09:00"')).toBeVisible();
  //   await expect(testTaskRow.locator('text="17:00"')).toBeVisible();

  //   // Verify duration is calculated (should be 08:00 for 9:00-17:00)
  //   await expect(testTaskRow.locator('text="08:00"')).toBeVisible();
  // });

  test("should show validation errors for invalid task data", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for the page to load - target the main task table specifically
    await expect(page.locator("table.mantine-Table-table")).toBeVisible();

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
  });

  test("should select date using date picker", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load - target the main task table specifically
    await expect(page.locator("table.mantine-Table-table")).toBeVisible();

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

    // Wait for the date picker to open
    await expect(page.locator(".mantine-Popover-dropdown")).toBeVisible();

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
    await expect(page.locator(".mantine-Popover-dropdown")).not.toBeVisible();

    // Verify that the input now has a value (should be in YYYY-MM-DD format)
    // For Mantine DatePickerInput, the value is displayed as text content
    const inputValue = await dateInput.textContent();
    expect(inputValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(inputValue).not.toBe("");

    // Test using preset buttons
    await dateInput.click();
    await expect(page.locator(".mantine-Popover-dropdown")).toBeVisible();

    // Click on "Today" preset
    const todayPreset = page
      .locator(".mantine-DatePickerInput-presetButton")
      .filter({ hasText: "Today" });
    await expect(todayPreset).toBeVisible();
    await todayPreset.click();

    // Verify the date picker closes and today's date is selected
    await expect(page.locator(".mantine-Popover-dropdown")).not.toBeVisible();

    const todayValue = await dateInput.textContent();
    const expectedToday = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    expect(todayValue).toBe(expectedToday);

    // Test "Yesterday" preset
    await dateInput.click();
    await expect(page.locator(".mantine-Popover-dropdown")).toBeVisible();

    const yesterdayPreset = page
      .locator(".mantine-DatePickerInput-presetButton")
      .filter({ hasText: "Yesterday" });
    await expect(yesterdayPreset).toBeVisible();
    await yesterdayPreset.click();

    await expect(page.locator(".mantine-Popover-dropdown")).not.toBeVisible();

    const yesterdayValue = await dateInput.textContent();
    const expectedYesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    expect(yesterdayValue).toBe(expectedYesterday);
  });

  // test("should prevent adding task when there's an incomplete task", async ({
  //   page,
  // }) => {
  //   await page.goto("/");

  //   // Wait for the page to load - target the main task table specifically
  //   await expect(page.locator("table.mantine-Table-table")).toBeVisible();

  //   // First, ensure we have a complete task, then create an incomplete one
  //   const addButton = page.getByTestId("button-add-task");

  //   // If Add button is not visible, complete any incomplete task first
  //   let isAddButtonVisible = await addButton.isVisible();
  //   if (!isAddButtonVisible) {
  //     const emptyEndTimeInput = page.getByTestId("add-entry-input-end-time");
  //     if (await emptyEndTimeInput.isVisible()) {
  //       await emptyEndTimeInput.fill("17:00");
  //       await emptyEndTimeInput.blur();
  //       await expect(addButton).toBeVisible({ timeout: 5000 });
  //     }
  //   }

  //   // Create an incomplete task (without end time)
  //   const startTimeInput = page
  //     .getByTestId("add-entry-input-start-time")
  //     .first();
  //   await startTimeInput.fill("10:00");

  //   const commentInput = page.getByTestId("add-entry-input-comment");
  //   await commentInput.fill("This task has no end time");

  //   // Click Add to create incomplete task
  //   await addButton.click();

  //   // Wait for task to be added
  //   await page.waitForTimeout(1000);

  //   // Now the Add button should be hidden because there's an incomplete task
  //   await expect(addButton).not.toBeVisible();

  //   // Verify the incomplete task is shown in the table
  //   const incompleteTaskRow = page.locator("table tbody tr").filter({
  //     has: page.locator('text="Incomplete Task Project"'),
  //   });

  //   await expect(incompleteTaskRow).toBeVisible();

  //   // The duration should show "..." for incomplete tasks
  //   await expect(incompleteTaskRow.locator('text="..."')).toBeVisible();
  // });
});
