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

function getTodayIso(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterdayIso(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

function getTomorrowIso(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

test.describe("Calendar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
  });

  test("should show today's date in the calendar with green indicator", async ({
    page,
  }) => {
    const todayIso = getTodayIso();
    const yesterdayIso = getYesterdayIso();

    await expect(page.getByTestId("summary-date-picker")).toBeVisible();
    const todayCell = page.getByTestId(`summary-date-day-${todayIso}`);
    const yesterdayCell = page.getByTestId(`summary-date-day-${yesterdayIso}`);

    await expect(todayCell).toBeVisible();
    await expect(
      todayCell.locator(".mantine-Indicator-indicator"),
    ).toBeVisible();

    await expect(yesterdayCell).toBeVisible();
    await expect(
      yesterdayCell.locator(".mantine-Indicator-indicator"),
    ).not.toBeVisible();
  });

  test("should select a single date and show tasks for that date", async ({
    page,
  }) => {
    await addTask(page, "CalProject", "", "09:00", "10:00");

    // Today should be selected by default, showing the task
    await expect(page.locator('[data-testid^="task-row-"]')).toHaveCount(1);
  });

  test("should select a date range across multiple days", async ({ page }) => {
    const todayIso = getTodayIso();
    const tomorrowIso = getTomorrowIso();

    // Click today and then tomorrow to select a range
    await page.getByTestId(`summary-date-day-${todayIso}`).click();
    await page.getByTestId(`summary-date-day-${tomorrowIso}`).click();

    // The task list table should remain functional
    await expect(page.getByTestId("task-list-table")).toBeVisible();
  });

  test("should filter tasks to show only selected date", async ({ page }) => {
    // Add a task for today
    await addTask(page, "FilterProject", "", "09:00", "10:00");

    // Add a task for yesterday via the date picker preset
    await ensureAddButtonIsVisible(page);
    await page.getByTestId("add-entry-input-date").click();
    await page.getByRole("button", { name: "Yesterday" }).click();
    await page.getByTestId("add-entry-input-start-time").fill("14:00");
    await page.getByTestId("add-entry-input-end-time").fill("16:00");
    await page.getByTestId("add-entry-input-project").fill("FilterProject");
    await page.getByTestId("button-add-task").click();
    await expect(page.getByTestId("button-add-task")).toBeVisible({
      timeout: 5000,
    });

    // Select only today in the calendar
    const todayIso = getTodayIso();
    await page.getByTestId(`summary-date-day-${todayIso}`).click();
    await page.getByTestId(`summary-date-day-${todayIso}`).click();

    // Should only show today's task
    await expect(page.locator('[data-testid^="task-row-"]')).toHaveCount(1);

    // Now select only yesterday
    const yesterdayIso = getYesterdayIso();
    await page.getByTestId(`summary-date-day-${yesterdayIso}`).click();
    await page.getByTestId(`summary-date-day-${yesterdayIso}`).click();

    // Should only show yesterday's task
    await expect(page.locator('[data-testid^="task-row-"]')).toHaveCount(1);
  });
});
