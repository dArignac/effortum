import { expect, Page, test } from "@playwright/test";

async function ensureAddButtonIsVisible(page: Page) {
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
}

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

test.describe("Task List Display and Sorting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
  });

  test("should display tasks sorted chronologically by start time even when added out of order", async ({
    page,
  }) => {
    // Add tasks in reverse / mixed order
    await addTask(page, "SortProject", "Afternoon", "15:00", "16:00");
    await addTask(page, "SortProject", "Morning", "08:30", "09:30");
    await addTask(page, "SortProject", "Lunch", "12:00", "13:00");

    const taskRows = page.locator('[data-testid^="task-row-"]');
    await expect(taskRows).toHaveCount(3);

    // Row 0 should be 08:30
    await expect(
      taskRows.nth(0).locator("td").nth(1).locator("input"),
    ).toHaveValue("08:30");
    await expect(
      taskRows.nth(0).locator("td").nth(4).locator("input"),
    ).toHaveValue("Morning");

    // Row 1 should be 12:00
    await expect(
      taskRows.nth(1).locator("td").nth(1).locator("input"),
    ).toHaveValue("12:00");
    await expect(
      taskRows.nth(1).locator("td").nth(4).locator("input"),
    ).toHaveValue("Lunch");

    // Row 2 should be 15:00
    await expect(
      taskRows.nth(2).locator("td").nth(1).locator("input"),
    ).toHaveValue("15:00");
    await expect(
      taskRows.nth(2).locator("td").nth(4).locator("input"),
    ).toHaveValue("Afternoon");
  });

  test("should display correctly formatted duration in the duration column", async ({
    page,
  }) => {
    await addTask(page, "DurationProject", "One hour 45 min", "09:00", "10:45");
    await addTask(page, "DurationProject", "Twenty minutes", "11:00", "11:20");

    const taskRows = page.locator('[data-testid^="task-row-"]');
    await expect(taskRows).toHaveCount(2);

    // Duration is in column index 5 (Date:0, Start:1, End:2, Project:3, Comment:4, Duration:5, Actions:6)
    await expect(taskRows.nth(0).locator("td").nth(5)).toHaveText("01:45");
    await expect(taskRows.nth(1).locator("td").nth(5)).toHaveText("00:20");
  });

  test("should display ellipsis duration for running incomplete task", async ({
    page,
  }) => {
    await ensureAddButtonIsVisible(page);

    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").clear();
    await page.getByTestId("add-entry-input-project").fill("RunningDuration");
    await page.getByTestId("button-add-task").click();

    const taskRow = page.locator('[data-testid^="task-row-"]').first();
    await expect(taskRow).toBeVisible();

    // Incomplete task should show "..." in duration column
    await expect(taskRow.locator("td").nth(5)).toHaveText("...");
  });

  test("should update duration display immediately when start or end time is edited", async ({
    page,
  }) => {
    await addTask(page, "EditDuration", "", "09:00", "10:00");

    const taskRow = page.locator('[data-testid^="task-row-"]').first();
    await expect(taskRow.locator("td").nth(5)).toHaveText("01:00");

    // Change end time to 11:30
    await taskRow.locator("td").nth(2).locator("input").fill("11:30");

    // Duration should update immediately based on field values
    await expect(taskRow.locator("td").nth(5)).toHaveText("02:30");
  });
});
