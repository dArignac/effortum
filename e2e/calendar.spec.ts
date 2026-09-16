import { expect, Page, test } from "@playwright/test";
import { ensureAddButtonIsVisible } from "./utils";

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

  test("should filter tasks by single date and date range across multiple days", async ({
    page,
  }) => {
    const todayIso = getTodayIso();
    const yesterdayIso = getYesterdayIso();

    // Add a task for today
    await addTask(page, "TodayProject", "Today Task", "09:00", "10:00");

    // Add a task for yesterday via the date picker preset
    await ensureAddButtonIsVisible(page);
    await page.getByTestId("add-entry-input-date").click();
    await page.getByRole("button", { name: "Yesterday" }).click();
    await page.getByTestId("add-entry-input-start-time").fill("14:00");
    await page.getByTestId("add-entry-input-end-time").fill("16:00");
    await page.getByTestId("add-entry-input-project").fill("YesterdayProject");
    await page.getByTestId("add-entry-input-comment").fill("Yesterday Task");
    await page.getByTestId("button-add-task").click();
    await expect(page.getByTestId("button-add-task")).toBeVisible({
      timeout: 5000,
    });

    // 1. Select only today: verify only today's task is shown with exact date and details
    await page.getByTestId(`summary-date-day-${todayIso}`).click();
    await page.getByTestId(`summary-date-day-${todayIso}`).click();

    const todayRows = page.locator('[data-testid^="task-row-"]');
    await expect(todayRows).toHaveCount(1);
    const todayRow = todayRows.first();
    await expect(todayRow.getByTestId(`date-selection-${todayIso}`)).toHaveText(
      todayIso,
    );
    await expect(todayRow.locator("td").nth(3).locator("input")).toHaveValue(
      "TodayProject",
    );
    await expect(todayRow.locator("td").nth(4).locator("input")).toHaveValue(
      "Today Task",
    );

    // 2. Select only yesterday: verify only yesterday's task is shown with exact date and details
    await page.getByTestId(`summary-date-day-${yesterdayIso}`).click();
    await page.getByTestId(`summary-date-day-${yesterdayIso}`).click();

    const yesterdayRows = page.locator('[data-testid^="task-row-"]');
    await expect(yesterdayRows).toHaveCount(1);
    const yesterdayRow = yesterdayRows.first();
    await expect(
      yesterdayRow.getByTestId(`date-selection-${yesterdayIso}`),
    ).toHaveText(yesterdayIso);
    await expect(
      yesterdayRow.locator("td").nth(3).locator("input"),
    ).toHaveValue("YesterdayProject");
    await expect(
      yesterdayRow.locator("td").nth(4).locator("input"),
    ).toHaveValue("Yesterday Task");

    // 3. Select date range [yesterday, today]: verify both tasks are shown with exact dates and details
    await page.getByTestId(`summary-date-day-${yesterdayIso}`).click();
    await page.getByTestId(`summary-date-day-${todayIso}`).click();

    const rangeRows = page.locator('[data-testid^="task-row-"]');
    await expect(rangeRows).toHaveCount(2);

    // First row: yesterday's task (chronologically earlier)
    const firstRow = rangeRows.nth(0);
    await expect(
      firstRow.getByTestId(`date-selection-${yesterdayIso}`),
    ).toHaveText(yesterdayIso);
    await expect(firstRow.locator("td").nth(3).locator("input")).toHaveValue(
      "YesterdayProject",
    );
    await expect(firstRow.locator("td").nth(4).locator("input")).toHaveValue(
      "Yesterday Task",
    );

    // Second row: today's task
    const secondRow = rangeRows.nth(1);
    await expect(
      secondRow.getByTestId(`date-selection-${todayIso}`),
    ).toHaveText(todayIso);
    await expect(secondRow.locator("td").nth(3).locator("input")).toHaveValue(
      "TodayProject",
    );
    await expect(secondRow.locator("td").nth(4).locator("input")).toHaveValue(
      "Today Task",
    );
  });
});
