import { expect, test } from "@playwright/test";
import { addTask } from "./utils";

test.describe("Issue #129: Show spent time per project in percent", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
  });

  test("should display spent time per project in percent matching Example 2 (18 %, 9 %, 74 %)", async ({
    page,
  }) => {
    // Project A: 01:30 (90 min)
    await addTask(page, "Project A", "08:00", "09:30", "Task A");
    // Project B: 00:45 (45 min)
    await addTask(page, "Project B", "09:30", "10:15", "Task B");
    // Project C: 06:15 (375 min)
    await addTask(page, "Project C", "10:15", "16:30", "Task C");

    // Total = 510 min -> 08:30
    await expect(page.getByTestId("summary-sum-value")).toHaveText("08:30");

    // Percentages are hidden by default (#241)
    await expect(
      page.getByTestId("summary-percentage-Project A"),
    ).not.toBeVisible();

    // Enable "Show percentages"
    await page.getByTestId("checkbox-show-percentages").click();

    // Check individual percentages
    await expect(page.getByTestId("summary-percentage-Project A")).toHaveText(
      "18 %",
    );
    await expect(page.getByTestId("summary-percentage-Project B")).toHaveText(
      "9 %",
    );
    await expect(page.getByTestId("summary-percentage-Project C")).toHaveText(
      "74 %",
    );

    // Check footer sum row does NOT display any percentage
    const sumRow = page.getByTestId("summary-sum-row");
    await expect(sumRow).not.toContainText("%");
  });

  test("should align cells vertically at top", async ({ page }) => {
    await addTask(page, "Project Align", "09:00", "10:00", "Alignment test");

    // Enable "Show percentages"
    await page.getByTestId("checkbox-show-percentages").click();

    const percentageElement = page.getByTestId(
      "summary-percentage-Project Align",
    );
    await expect(percentageElement).toBeVisible();

    const verticalAlign = await percentageElement.evaluate((el) => {
      const td = el.closest("td");
      return td ? window.getComputedStyle(td).verticalAlign : "";
    });

    expect(verticalAlign).toBe("top");
  });

  test("should display percentages in list-by-task mode", async ({ page }) => {
    await addTask(page, "Project Alpha", "08:00", "09:00", "Design work");
    await addTask(page, "Project Alpha", "09:00", "11:00", "Development work");

    // Switch to list by task
    await page.getByTestId("checkbox-list-by-task").click();

    // Enable "Show percentages"
    await page.getByTestId("checkbox-show-percentages").click();

    // 1 hour / 3 hours = 33 %
    // 2 hours / 3 hours = 67 %
    await expect(page.getByTestId("summary-percentage-Design work")).toHaveText(
      "33 %",
    );
    await expect(
      page.getByTestId("summary-percentage-Development work"),
    ).toHaveText("67 %");

    // Check footer sum row does NOT display any percentage
    await expect(page.getByTestId("summary-sum-row")).not.toContainText("%");
  });
});
