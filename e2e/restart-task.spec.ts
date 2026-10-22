import { expect, test } from "@playwright/test";
import { addTask } from "./utils";

test.describe("Restart Task Action (#224)", () => {
  test("displays Play button as the last button in the actions column for logged tasks", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    await addTask(page, "Project Alpha", "08:00", "09:30", "Feature planning");

    const taskRow = page.locator('[data-testid^="task-row-"]').first();
    await expect(taskRow).toBeVisible();

    // The play button must be visible with player-play icon and aria-label
    const playButton = taskRow.getByRole("button", { name: "Restart Task" });
    await expect(playButton).toBeVisible();
    await expect(
      playButton.locator("svg.tabler-icon-player-play"),
    ).toBeVisible();

    // Check that it is the last button in the actions cell
    const actionsCell = taskRow.locator("td").last();
    const actionButtons = actionsCell.locator("button");
    const count = await actionButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);
    await expect(actionButtons.last()).toHaveAttribute(
      "aria-label",
      "Restart Task",
    );
  });

  test("starts a task with current time, matching project and comment, and hides play button while running", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    await addTask(page, "Rocket Science", "08:00", "09:00", "Propulsion test");

    const taskRows = page.locator('[data-testid^="task-row-"]');
    await expect(taskRows).toHaveCount(1);

    const playButton = taskRows
      .first()
      .getByRole("button", { name: "Restart Task" });
    await playButton.click();

    await expect(page.getByText("Task started successfully!")).toBeVisible();

    // Now there should be two tasks: original completed task and new running task
    await expect(taskRows).toHaveCount(2);

    // Find the running task (duration is "...")
    const runningTaskRow = taskRows.filter({ hasText: "..." });
    await expect(runningTaskRow).toBeVisible();

    // Verify project and comment match the original task
    await expect(
      runningTaskRow.locator("td").nth(3).locator("input"),
    ).toHaveValue("Rocket Science");
    await expect(
      runningTaskRow.locator("td").nth(4).locator("input"),
    ).toHaveValue("Propulsion test");

    // The play button MUST NOT be shown on any task when a task is running
    await expect(
      page.getByRole("button", { name: "Restart Task" }),
    ).toHaveCount(0);

    // Stop button should be visible on the running task
    const stopButton = runningTaskRow.getByRole("button", {
      name: "Stop Task",
    });
    await expect(stopButton).toBeVisible();

    // Stopping the running task should restore the play buttons
    await stopButton.click();
    await expect(
      page.getByRole("button", { name: "Restart Task" }),
    ).toHaveCount(2);
  });

  test("respects round times to nearest 5 minutes setting when starting task", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // Enable 5-minute rounding in settings
    await page.getByTestId("navigation-burger").click();
    await page.getByTestId("nav-settings").click();

    const roundSwitch = page.getByRole("switch", {
      name: "Round times to the nearest 5 minutes",
    });
    await roundSwitch.check();
    await page.getByTestId("settings-submit-button").click();
    await expect(
      page.getByText("Settings updated successfully!"),
    ).toBeVisible();

    // Return to main time tracking page
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    await addTask(page, "Rounding Project", "08:00", "09:00", "Rounded test");

    const playButton = page
      .getByRole("button", { name: "Restart Task" })
      .first();
    await playButton.click();
    await expect(page.getByText("Task started successfully!")).toBeVisible();

    const runningTaskRow = page
      .locator('[data-testid^="task-row-"]')
      .filter({ hasText: "..." });
    await expect(runningTaskRow).toBeVisible();

    const startTimeValue = await runningTaskRow
      .locator("td")
      .nth(1)
      .locator("input")
      .inputValue();

    // Minutes should be divisible by 5
    const [, minutesStr] = startTimeValue.split(":");
    const minutes = parseInt(minutesStr, 10);
    expect(minutes % 5).toBe(0);
  });

  test("keeps action buttons on a single line without breaking", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    await addTask(page, "Layout Check", "09:00", "10:00", "Alignment");

    const taskRow = page.locator('[data-testid^="task-row-"]').first();
    const actionButtons = taskRow.locator("td").last().locator("button");
    await expect(actionButtons).toHaveCount(2);

    const box1 = await actionButtons.nth(0).boundingBox();
    const box2 = await actionButtons.nth(1).boundingBox();

    expect(box1).not.toBeNull();
    expect(box2).not.toBeNull();

    // Vertical position (top) must be identical (or within 1px subpixel rendering), confirming single line
    expect(Math.abs((box1?.y ?? 0) - (box2?.y ?? 0))).toBeLessThanOrEqual(2);
  });
});
