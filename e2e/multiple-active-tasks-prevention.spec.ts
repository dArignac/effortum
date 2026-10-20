import { expect, test } from "@playwright/test";

test.describe("Multiple Active Tasks Prevention (#217)", () => {
  test("prevents starting a new active task when an active task is already running, shows alert and running task additionally", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // 1. Start an active task on yesterday and leave it running
    await page.getByTestId("add-entry-input-date").click();
    await page.getByRole("button", { name: "Yesterday" }).click();
    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").clear();
    await page.getByTestId("add-entry-input-project").fill("Vacation Project");
    await page.getByTestId("add-entry-input-comment").fill("Pre-vacation work");
    await page.getByTestId("button-add-task").click();

    // 2. Select today in the calendar (simulating returning after vacation)
    const todayIso = new Date().toISOString().split("T")[0];
    await page.getByTestId(`summary-date-day-${todayIso}`).click();
    await page.getByTestId(`summary-date-day-${todayIso}`).click();

    // Verify the Active Task Alert is visible and contains task details
    const activeAlert = page.getByTestId("active-task-alert");
    await expect(activeAlert).toBeVisible();
    await expect(activeAlert).toContainText("Vacation Project");
    await expect(activeAlert).toContainText("09:00");
    await expect(activeAlert).toContainText("Only one active task is allowed");

    // Verify the running task is shown additionally in the table
    const externalRow = page.getByTestId("active-running-task-row");
    await expect(externalRow).toBeVisible();
    await expect(externalRow).toContainText("Vacation Project");
    await expect(externalRow).toContainText("09:00");
    await expect(externalRow).toContainText("Active");

    // 3. User tries to start a new active task for today (leaving End time empty) -> PREVENTED!
    await page.getByTestId("add-entry-input-start-time").fill("10:00");
    await page.getByTestId("add-entry-input-end-time").clear();
    await page.getByTestId("add-entry-input-project").fill("First Day Back");
    await page.getByTestId("button-add-task").click();

    // Validation error must be displayed and task must not be started
    await expect(
      page.locator('text="End time is required while another task is running"'),
    ).toBeVisible({ timeout: 5000 });

    // 4. User CAN still add a completed task for today
    await page.getByTestId("add-entry-input-end-time").fill("11:00");
    await page.getByTestId("button-add-task").click();

    // The completed task should now appear in the today's task rows
    await expect(page.locator('[data-testid^="task-row-"]')).toHaveCount(1, {
      timeout: 5000,
    });

    // 5. User clicks "Go to [date]" in the alert to navigate to yesterday
    await page.getByTestId("button-go-to-active-task-date").click();

    // On yesterday's date view, the alert is not shown (it's the current selected date)
    await expect(page.getByTestId("active-task-alert")).not.toBeVisible();
    // But the running task is visible as a normal task row with a stop button
    const stopButton = page
      .locator('[data-testid^="button-stop-task-"]')
      .first();
    await expect(stopButton).toBeVisible();

    // 6. Stop the running task
    await stopButton.click();

    // 7. Return to today's date
    await page.getByTestId(`summary-date-day-${todayIso}`).click();
    await page.getByTestId(`summary-date-day-${todayIso}`).click();

    // The alert and additional row are gone
    await expect(page.getByTestId("active-task-alert")).not.toBeVisible();
    await expect(page.getByTestId("active-running-task-row")).not.toBeVisible();

    // Now the user CAN start a new active task for today!
    await page.getByTestId("add-entry-input-start-time").fill("14:00");
    await page.getByTestId("add-entry-input-end-time").clear();
    await page.getByTestId("add-entry-input-project").fill("Today Active Task");
    await page.getByTestId("button-add-task").click();

    // While running, Add button should be hidden on today
    await expect(page.getByTestId("button-add-task")).not.toBeVisible();
  });

  test("allows stopping running task directly from the alert button", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // 1. Create running task on yesterday
    await page.getByTestId("add-entry-input-date").click();
    await page.getByRole("button", { name: "Yesterday" }).click();
    await page.getByTestId("add-entry-input-start-time").fill("08:30");
    await page.getByTestId("add-entry-input-end-time").clear();
    await page.getByTestId("add-entry-input-project").fill("Yesterday Task");
    await page.getByTestId("button-add-task").click();

    // 2. Select today
    const todayIso = new Date().toISOString().split("T")[0];
    await page.getByTestId(`summary-date-day-${todayIso}`).click();
    await page.getByTestId(`summary-date-day-${todayIso}`).click();

    await expect(page.getByTestId("active-task-alert")).toBeVisible();

    // 3. Click "Stop Task" directly on the alert
    await page.getByTestId("button-stop-active-task").click();

    // Verify alert and additional row disappear immediately
    await expect(page.getByTestId("active-task-alert")).not.toBeVisible();
    await expect(page.getByTestId("active-running-task-row")).not.toBeVisible();
  });
});
