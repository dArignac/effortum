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
});
