import { expect, test } from "@playwright/test";
import { addTask, ensureAddButtonIsVisible } from "./utils";

test.describe("Summary", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
  });

  test("should display sum of completed tasks grouped by project", async ({
    page,
  }) => {
    await addTask(page, "Alpha", "09:00", "10:00");
    await addTask(page, "Beta", "10:30", "11:30");

    await expect(page.getByTestId("summary-sum-value")).toHaveText("02:00");
  });

  test("should toggle between project and task grouping", async ({ page }) => {
    await addTask(page, "ProjectA", "09:00", "10:00", "meeting");
    await addTask(page, "ProjectA", "10:30", "11:30", "coding");

    // Default: grouped by project - should show one row "ProjectA"
    const summaryTable = page.locator("table").last();
    await expect(
      summaryTable.locator("td", { hasText: "ProjectA" }),
    ).toHaveCount(1);

    // Toggle to list by task
    await page.getByTestId("checkbox-list-by-task").click();

    // Should now show two rows: "coding" and "meeting"
    await expect(summaryTable.locator("td", { hasText: "coding" })).toHaveCount(
      1,
    );
    await expect(
      summaryTable.locator("td", { hasText: "meeting" }),
    ).toHaveCount(1);
  });

  test("should show sum of zero when no tasks exist for selected date", async ({
    page,
  }) => {
    // No tasks added - default view should show 00:00
    await expect(page.getByTestId("summary-sum-value")).toHaveText("00:00");
  });

  test("should filter summary by date range from calendar", async ({
    page,
  }) => {
    // Add a task for today
    await addTask(page, "FilterProject", "09:00", "10:00");

    // Add a task for yesterday using the date picker preset
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

    // Select only today in the calendar (click today's date twice for single-day range)
    const todayIso = new Date().toISOString().split("T")[0];
    await page.getByTestId(`summary-date-day-${todayIso}`).click();
    await page.getByTestId(`summary-date-day-${todayIso}`).click();

    // Sum should only include today's task: 01:00
    await expect(page.getByTestId("summary-sum-value")).toHaveText("01:00");
  });

  test("should prepend project name when same comment exists across multiple projects in list-by-task mode", async ({
    page,
  }) => {
    await addTask(page, "PA", "09:00", "10:00", "meeting");
    await addTask(page, "PB", "10:30", "11:30", "meeting");

    // Toggle to list by task
    await page.getByTestId("checkbox-list-by-task").click();

    // When a comment appears in multiple projects, the label should be "ProjectName: comment"
    const summaryTable = page.locator("table").last();
    await expect(
      summaryTable.locator("td", { hasText: "PA: meeting" }),
    ).toHaveCount(1);
    await expect(
      summaryTable.locator("td", { hasText: "PB: meeting" }),
    ).toHaveCount(1);
  });

  test("should display (No comment) for tasks without comments in list-by-task mode", async ({
    page,
  }) => {
    await addTask(page, "SoloProject", "09:00", "10:00");
    await addTask(page, "SoloProject", "10:00", "11:30", "Design");

    // Toggle to list by task
    await page.getByTestId("checkbox-list-by-task").click();

    const summaryTable = page.locator("table").last();
    await expect(
      summaryTable.locator("td", { hasText: "(No comment)" }),
    ).toHaveCount(1);
    await expect(summaryTable.locator("td", { hasText: "Design" })).toHaveCount(
      1,
    );
    await expect(page.getByTestId("summary-sum-value")).toHaveText("02:30");
  });
});
