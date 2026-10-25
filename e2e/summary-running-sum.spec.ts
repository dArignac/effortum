import { formatDuration } from "@/utils/time";
import { expect, test } from "@playwright/test";
import dayjs from "dayjs";

function getMinutesSinceMidnight(date: Date): number {
  const dateStr = dayjs(date).format("YYYY-MM-DD");
  return dayjs(date).diff(dayjs(`${dateStr} 00:00`), "minute");
}

test.describe("Summary sum including running task", () => {
  test("shows an additional sum line including the running task for the selected date", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").fill("10:00");
    await page
      .getByTestId("add-entry-input-project")
      .fill("Running Sum Project");
    await page.getByTestId("button-add-task").click();

    await page.getByTestId("add-entry-input-start-time").fill("00:00");
    await page.getByTestId("add-entry-input-end-time").fill("");
    await page
      .getByTestId("add-entry-input-project")
      .fill("Running Sum Project");

    const beforeAdd = new Date();
    await page.getByTestId("button-add-task").click();
    const afterAdd = new Date();

    await expect(page.getByTestId("summary-sum-row")).toBeVisible();
    await expect(page.getByTestId("summary-sum-value")).toHaveText("01:00");
    await expect(
      page.getByTestId("summary-sum-including-running-row"),
    ).toBeVisible();

    const expectedBefore = formatDuration(
      getMinutesSinceMidnight(beforeAdd) + 60,
    );
    const expectedAfter = formatDuration(
      getMinutesSinceMidnight(afterAdd) + 60,
    );
    await expect(
      page.getByTestId("summary-sum-including-running-value"),
    ).toHaveText(new RegExp(`^(${expectedBefore}|${expectedAfter})$`));
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

  test("shows the running sum line when a running task is added even if an incomplete task exists on another date", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // 1. Create an incomplete running task for yesterday
    await page.getByTestId("add-entry-input-date").click();
    await page.getByRole("button", { name: "Yesterday" }).click();
    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").fill("");
    await page.getByTestId("add-entry-input-project").fill("Yesterday Running");
    await page.getByTestId("button-add-task").click();

    // 2. Select today in the calendar so today is the selected date range
    const todayIso = new Date().toISOString().split("T")[0];
    await page.getByTestId(`summary-date-day-${todayIso}`).click();
    await page.getByTestId(`summary-date-day-${todayIso}`).click();

    // Verify running sum is not visible for today yet
    await expect(
      page.getByTestId("summary-sum-including-running-row"),
    ).not.toBeVisible();

    // 3. Add a completed task for today
    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").fill("10:00");
    await page.getByTestId("add-entry-input-project").fill("Today Project");
    await page.getByTestId("button-add-task").click();

    // 4. Try to start a running task for today while yesterday's task is still running (prevented)
    await page.getByTestId("add-entry-input-start-time").fill("00:00");
    await page.getByTestId("add-entry-input-end-time").fill("");
    await page.getByTestId("add-entry-input-project").fill("Today Project");
    await page.getByTestId("button-add-task").click();
    await expect(
      page.locator('text="End time is required while another task is running"'),
    ).toBeVisible({ timeout: 5000 });

    // Stop yesterday's running task first
    await page.getByTestId("button-stop-active-task").click();

    // Now start the running task for today
    await page.getByTestId("button-add-task").click();

    // Expected: Summary sum including running task should be visible immediately WITHOUT page reload!
    await expect(
      page.getByTestId("summary-sum-including-running-row"),
    ).toBeVisible();
  });

  test("updates running sum value over time while task is actively running", async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-10-16T10:00:00") });
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    await page.getByTestId("add-entry-input-start-time").fill("10:00");
    await page.getByTestId("add-entry-input-end-time").fill("");
    await page.getByTestId("add-entry-input-project").fill("Clock Project");
    await page.getByTestId("button-add-task").click();

    await expect(
      page.getByTestId("summary-sum-including-running-row"),
    ).toBeVisible();
    await expect(
      page.getByTestId("summary-sum-including-running-value"),
    ).toHaveText("00:00");

    // Fast-forward 1 minute
    await page.clock.fastForward(60000);
    await expect(
      page.getByTestId("summary-sum-including-running-value"),
    ).toHaveText("00:01");

    // Fast-forward another 2 minutes
    await page.clock.fastForward(120000);
    await expect(
      page.getByTestId("summary-sum-including-running-value"),
    ).toHaveText("00:03");
  });
});
