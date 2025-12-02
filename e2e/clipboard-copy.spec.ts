import { test, expect } from "@playwright/test";

test.describe("Clipboard Copy Functionality", () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");

    // Wait for the page to load
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // Complete any incomplete tasks to ensure Add button is visible
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
  });

  test("should copy unique comments to clipboard for a single project", async ({
    page,
  }) => {
    // Add tasks with comments for a project
    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").fill("10:00");
    await page.getByTestId("add-entry-input-project").fill("ProjectA");
    await page.getByTestId("add-entry-input-comment").fill("Task 1");
    await page.getByTestId("button-add-task").click();

    await expect(page.getByTestId("button-add-task")).toBeVisible({
      timeout: 5000,
    });

    await page.getByTestId("add-entry-input-start-time").fill("10:00");
    await page.getByTestId("add-entry-input-end-time").fill("11:00");
    await page.getByTestId("add-entry-input-project").fill("ProjectA");
    await page.getByTestId("add-entry-input-comment").fill("Task 2");
    await page.getByTestId("button-add-task").click();

    // Wait for summary to update
    await page.waitForTimeout(500);

    // Click the clipboard button for ProjectA
    const clipboardButton = page.getByTestId("button-copy-comments-ProjectA");
    await expect(clipboardButton).toBeVisible();
    await clipboardButton.click();

    // Read clipboard content
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );

    // Should have both comments, sorted alphabetically, separated by newlines
    expect(clipboardText).toBe("Task 1\nTask 2");
  });

  test("should copy only unique comments (deduplication)", async ({ page }) => {
    // Add tasks with duplicate comments
    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").fill("10:00");
    await page.getByTestId("add-entry-input-project").fill("ProjectB");
    await page.getByTestId("add-entry-input-comment").fill("Duplicate Task");
    await page.getByTestId("button-add-task").click();

    await expect(page.getByTestId("button-add-task")).toBeVisible({
      timeout: 5000,
    });

    await page.getByTestId("add-entry-input-start-time").fill("10:00");
    await page.getByTestId("add-entry-input-end-time").fill("11:00");
    await page.getByTestId("add-entry-input-project").fill("ProjectB");
    await page.getByTestId("add-entry-input-comment").fill("Duplicate Task");
    await page.getByTestId("button-add-task").click();

    await expect(page.getByTestId("button-add-task")).toBeVisible({
      timeout: 5000,
    });

    await page.getByTestId("add-entry-input-start-time").fill("11:00");
    await page.getByTestId("add-entry-input-end-time").fill("12:00");
    await page.getByTestId("add-entry-input-project").fill("ProjectB");
    await page.getByTestId("add-entry-input-comment").fill("Unique Task");
    await page.getByTestId("button-add-task").click();

    // Wait for summary to update
    await page.waitForTimeout(500);

    // Click the clipboard button for ProjectB
    const clipboardButton = page.getByTestId("button-copy-comments-ProjectB");
    await expect(clipboardButton).toBeVisible();
    await clipboardButton.click();

    // Read clipboard content
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );

    // Should have only 2 unique comments, sorted
    expect(clipboardText).toBe("Duplicate Task\nUnique Task");
  });

  test("should handle tasks without comments", async ({ page }) => {
    // Add tasks without comments
    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").fill("10:00");
    await page.getByTestId("add-entry-input-project").fill("ProjectC");
    await page.getByTestId("button-add-task").click();

    await expect(page.getByTestId("button-add-task")).toBeVisible({
      timeout: 5000,
    });

    await page.getByTestId("add-entry-input-start-time").fill("10:00");
    await page.getByTestId("add-entry-input-end-time").fill("11:00");
    await page.getByTestId("add-entry-input-project").fill("ProjectC");
    await page.getByTestId("button-add-task").click();

    // Wait for summary to update
    await page.waitForTimeout(500);

    // Click the clipboard button for ProjectC
    const clipboardButton = page.getByTestId("button-copy-comments-ProjectC");
    await expect(clipboardButton).toBeVisible();
    await clipboardButton.click();

    // Read clipboard content
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );

    // Should be empty (no comments)
    expect(clipboardText).toBe("");
  });

  test("should copy comments sorted alphabetically", async ({ page }) => {
    // Add tasks with comments in non-alphabetical order
    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").fill("10:00");
    await page.getByTestId("add-entry-input-project").fill("ProjectD");
    await page.getByTestId("add-entry-input-comment").fill("Zebra");
    await page.getByTestId("button-add-task").click();

    await expect(page.getByTestId("button-add-task")).toBeVisible({
      timeout: 5000,
    });

    await page.getByTestId("add-entry-input-start-time").fill("10:00");
    await page.getByTestId("add-entry-input-end-time").fill("11:00");
    await page.getByTestId("add-entry-input-project").fill("ProjectD");
    await page.getByTestId("add-entry-input-comment").fill("Apple");
    await page.getByTestId("button-add-task").click();

    await expect(page.getByTestId("button-add-task")).toBeVisible({
      timeout: 5000,
    });

    await page.getByTestId("add-entry-input-start-time").fill("11:00");
    await page.getByTestId("add-entry-input-end-time").fill("12:00");
    await page.getByTestId("add-entry-input-project").fill("ProjectD");
    await page.getByTestId("add-entry-input-comment").fill("Mango");
    await page.getByTestId("button-add-task").click();

    // Wait for summary to update
    await page.waitForTimeout(500);

    // Click the clipboard button for ProjectD
    const clipboardButton = page.getByTestId("button-copy-comments-ProjectD");
    await expect(clipboardButton).toBeVisible();
    await clipboardButton.click();

    // Read clipboard content
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );

    // Should be sorted alphabetically
    expect(clipboardText).toBe("Apple\nMango\nZebra");
  });

  test("should only copy comments for selected project, not all projects", async ({
    page,
  }) => {
    // Add tasks for ProjectE
    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").fill("10:00");
    await page.getByTestId("add-entry-input-project").fill("ProjectE");
    await page.getByTestId("add-entry-input-comment").fill("E Task 1");
    await page.getByTestId("button-add-task").click();

    await expect(page.getByTestId("button-add-task")).toBeVisible({
      timeout: 5000,
    });

    // Add tasks for ProjectF
    await page.getByTestId("add-entry-input-start-time").fill("10:00");
    await page.getByTestId("add-entry-input-end-time").fill("11:00");
    await page.getByTestId("add-entry-input-project").fill("ProjectF");
    await page.getByTestId("add-entry-input-comment").fill("F Task 1");
    await page.getByTestId("button-add-task").click();

    // Wait for summary to update
    await page.waitForTimeout(500);

    // Click the clipboard button for ProjectE only
    const clipboardButtonE = page.getByTestId("button-copy-comments-ProjectE");
    await expect(clipboardButtonE).toBeVisible();
    await clipboardButtonE.click();

    // Read clipboard content
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );

    // Should only have ProjectE comments
    expect(clipboardText).toBe("E Task 1");
    expect(clipboardText).not.toContain("F Task 1");
  });

  test("should respect date range filter when copying comments", async ({
    page,
  }) => {
    // Add task for today
    await page.getByTestId("add-entry-input-date").click();
    const todayPreset = page
      .locator(".mantine-DatePickerInput-presetButton")
      .filter({ hasText: "Today" });
    await todayPreset.click();

    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").fill("10:00");
    await page.getByTestId("add-entry-input-project").fill("ProjectG");
    await page.getByTestId("add-entry-input-comment").fill("Today's Task");
    await page.getByTestId("button-add-task").click();

    await expect(page.getByTestId("button-add-task")).toBeVisible({
      timeout: 5000,
    });

    // Add task for yesterday
    await page.getByTestId("add-entry-input-date").click();
    const yesterdayPreset = page
      .locator(".mantine-DatePickerInput-presetButton")
      .filter({ hasText: "Yesterday" });
    await yesterdayPreset.click();

    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").fill("10:00");
    await page.getByTestId("add-entry-input-project").fill("ProjectG");
    await page.getByTestId("add-entry-input-comment").fill("Yesterday's Task");
    await page.getByTestId("button-add-task").click();

    // Wait for tasks to be added
    await page.waitForTimeout(500);

    // By default, date range should be today only
    // Click the clipboard button for ProjectG
    let clipboardButton = page.getByTestId("button-copy-comments-ProjectG");
    await expect(clipboardButton).toBeVisible();
    await clipboardButton.click();

    // Read clipboard content - should only have today's task
    let clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clipboardText).toBe("Today's Task");

    // Now change date range to include yesterday by clicking on yesterday's date in the summary date picker
    const summaryDatePicker = page.getByTestId("summary-date-picker");
    await expect(summaryDatePicker).toBeVisible();

    // Get yesterday's and today's dates
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDay = yesterday.getDate();

    const today = new Date();
    const todayDay = today.getDate();

    // For a range picker, click yesterday first, then today
    const yesterdayButton = summaryDatePicker
      .locator(`.mantine-DatePicker-day`)
      .filter({ hasText: new RegExp(`^${yesterdayDay}$`) })
      .first();
    await yesterdayButton.click();

    // Then click today to complete the range
    const todayButton = summaryDatePicker
      .locator(`.mantine-DatePicker-day`)
      .filter({ hasText: new RegExp(`^${todayDay}$`) })
      .first();
    await todayButton.click();

    // Wait for summary to update
    await page.waitForTimeout(500);

    // Click the clipboard button again
    clipboardButton = page.getByTestId("button-copy-comments-ProjectG");
    await clipboardButton.click();

    // Read clipboard content - should now have both tasks, sorted
    clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe("Today's Task\nYesterday's Task");
  });

  test("should handle mixed tasks (some with comments, some without)", async ({
    page,
  }) => {
    // Add task with comment
    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").fill("10:00");
    await page.getByTestId("add-entry-input-project").fill("ProjectH");
    await page.getByTestId("add-entry-input-comment").fill("Comment 1");
    await page.getByTestId("button-add-task").click();

    await expect(page.getByTestId("button-add-task")).toBeVisible({
      timeout: 5000,
    });

    // Add task without comment
    await page.getByTestId("add-entry-input-start-time").fill("10:00");
    await page.getByTestId("add-entry-input-end-time").fill("11:00");
    await page.getByTestId("add-entry-input-project").fill("ProjectH");
    await page.getByTestId("button-add-task").click();

    await expect(page.getByTestId("button-add-task")).toBeVisible({
      timeout: 5000,
    });

    // Add another task with comment
    await page.getByTestId("add-entry-input-start-time").fill("11:00");
    await page.getByTestId("add-entry-input-end-time").fill("12:00");
    await page.getByTestId("add-entry-input-project").fill("ProjectH");
    await page.getByTestId("add-entry-input-comment").fill("Comment 2");
    await page.getByTestId("button-add-task").click();

    // Wait for summary to update
    await page.waitForTimeout(500);

    // Click the clipboard button for ProjectH
    const clipboardButton = page.getByTestId("button-copy-comments-ProjectH");
    await expect(clipboardButton).toBeVisible();
    await clipboardButton.click();

    // Read clipboard content
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );

    // Should only have tasks with comments
    expect(clipboardText).toBe("Comment 1\nComment 2");
  });
});
