import { formatDuration } from "@/utils/time";
import { expect, test } from "@playwright/test";

function getMinutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

test.describe("Summary sum including running task", () => {
  test("shows an additional sum line including the running task for the selected date", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").fill("10:00");
    await page.getByTestId("add-entry-input-project").fill("Running Sum Project");
    await page.getByTestId("button-add-task").click();

    await page.getByTestId("add-entry-input-start-time").fill("00:00");
    await page.getByTestId("add-entry-input-end-time").fill("");
    await page.getByTestId("add-entry-input-project").fill("Running Sum Project");

    const beforeAdd = new Date();
    await page.getByTestId("button-add-task").click();
    const afterAdd = new Date();

    await expect(page.getByTestId("summary-sum-row")).toBeVisible();
    await expect(page.getByTestId("summary-sum-value")).toHaveText("01:00");
    await expect(
      page.getByTestId("summary-sum-including-running-row"),
    ).toBeVisible();

    const expectedBefore = formatDuration(getMinutesSinceMidnight(beforeAdd) + 60);
    const expectedAfter = formatDuration(getMinutesSinceMidnight(afterAdd) + 60);
    await expect(page.getByTestId("summary-sum-including-running-value")).toHaveText(
      new RegExp(`^(${expectedBefore}|${expectedAfter})$`),
    );
  });

  test("does not show the additional sum line when running task date is outside selected date", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    const todayIso = new Date().toISOString().split("T")[0];
    await page.getByTestId(`summary-date-day-${todayIso}`).click();
    await page.getByTestId(`summary-date-day-${todayIso}`).click();

    await page.getByTestId("add-entry-input-date").click();
    await page.getByRole("button", { name: "Yesterday" }).click();

    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").fill("");
    await page.getByTestId("add-entry-input-project").fill("Yesterday Running");
    await page.getByTestId("button-add-task").click();

    await expect(
      page.getByTestId("summary-sum-including-running-row"),
    ).not.toBeVisible();
  });
});
