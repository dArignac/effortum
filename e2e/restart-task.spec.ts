import { expect, test } from "@playwright/test";
import { addTask } from "./utils";

test.describe("Restart Task Action (#224, #291)", () => {
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

  test("starts a task with current time, matching project and comment, and retains play button on completed task while running", async ({
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

    // The running task MUST NOT have a play button, but MUST have a stop button
    await expect(
      runningTaskRow.getByRole("button", { name: "Restart Task" }),
    ).toHaveCount(0);
    const stopButton = runningTaskRow.getByRole("button", {
      name: "Stop Task",
    });
    await expect(stopButton).toBeVisible();

    // The completed task MUST still have its Restart Task (Play) button
    const completedTaskRow = taskRows.filter({ hasNotText: "..." });
    await expect(
      completedTaskRow.getByRole("button", { name: "Restart Task" }),
    ).toBeVisible();

    // Stopping the running task should result in both completed tasks having play buttons
    await stopButton.click();
    await expect(
      page.getByRole("button", { name: "Restart Task" }),
    ).toHaveCount(2);
  });

  test("clicking restart on a completed task while another task is running stops the active task and starts the new task", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // Add two completed tasks
    await addTask(page, "Project Alpha", "08:00", "09:00", "First task");
    await addTask(page, "Project Beta", "09:00", "10:00", "Second task");

    const taskRows = page.locator('[data-testid^="task-row-"]');
    await expect(taskRows).toHaveCount(2);

    // Start Project Alpha by clicking its Restart Task button
    const alphaRow = taskRows.first();
    await expect(alphaRow.locator("td").nth(3).locator("input")).toHaveValue(
      "Project Alpha",
    );
    await alphaRow.getByRole("button", { name: "Restart Task" }).click();
    await expect(page.getByText("Task started successfully!")).toBeVisible();

    // There should now be 3 tasks: Alpha (completed), Beta (completed), and Alpha (running)
    await expect(taskRows).toHaveCount(3);
    const runningAlphaRow = taskRows.filter({ hasText: "..." });
    await expect(runningAlphaRow).toHaveCount(1);
    await expect(
      runningAlphaRow.first().locator("td").nth(3).locator("input"),
    ).toHaveValue("Project Alpha");

    // Click Restart Task on Project Beta while Alpha is running
    const betaRow = taskRows.nth(1);
    await expect(betaRow.locator("td").nth(3).locator("input")).toHaveValue(
      "Project Beta",
    );
    await betaRow.getByRole("button", { name: "Restart Task" }).click();
    await expect(
      page.getByText("Task started successfully!").first(),
    ).toBeVisible();

    // There should now be 4 tasks: Alpha (completed), Beta (completed), Alpha (stopped), Beta (running)
    await expect(taskRows).toHaveCount(4);

    // Only one task should now be running (Project Beta)
    const runningRows = taskRows.filter({ hasText: "..." });
    await expect(runningRows).toHaveCount(1);
    await expect(
      runningRows.first().locator("td").nth(3).locator("input"),
    ).toHaveValue("Project Beta");

    // Verify the end time of the stopped task equals the start time of the new running task
    const runningStartTime = await runningRows
      .first()
      .locator("td")
      .nth(1)
      .locator("input")
      .inputValue();
    expect(runningStartTime).toMatch(/^\d{2}:\d{2}$/);

    // Among all completed tasks, exactly one was stopped at runningStartTime
    const completedRows = taskRows.filter({ hasNotText: "..." });
    await expect(completedRows).toHaveCount(3);

    const newlyStoppedAlphaRow = completedRows.filter({
      has: page.locator(`td:nth-child(3) input[value="${runningStartTime}"]`),
    });
    await expect(newlyStoppedAlphaRow).toHaveCount(1);
    await expect(
      newlyStoppedAlphaRow.locator("td").nth(3).locator("input"),
    ).toHaveValue("Project Alpha");
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

  test("respects round times to nearest 5 minutes when switching running tasks", async ({
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

    await addTask(page, "Project Alpha", "08:00", "09:00", "Task A");
    await addTask(page, "Project Beta", "09:00", "10:00", "Task B");

    const taskRows = page.locator('[data-testid^="task-row-"]');
    await expect(taskRows).toHaveCount(2);

    // Start Alpha
    const alphaRow = taskRows.first();
    await expect(alphaRow.locator("td").nth(3).locator("input")).toHaveValue(
      "Project Alpha",
    );
    await alphaRow.getByRole("button", { name: "Restart Task" }).click();
    await expect(page.getByText("Task started successfully!")).toBeVisible();

    // Switch to Beta
    const betaRow = taskRows.nth(1);
    await expect(betaRow.locator("td").nth(3).locator("input")).toHaveValue(
      "Project Beta",
    );
    await betaRow.getByRole("button", { name: "Restart Task" }).click();
    await expect(
      page.getByText("Task started successfully!").first(),
    ).toBeVisible();

    // Verify running Beta task's start time is divisible by 5
    const runningRow = taskRows.filter({ hasText: "..." }).first();
    const runningStartTime = await runningRow
      .locator("td")
      .nth(1)
      .locator("input")
      .inputValue();
    const [, minutesStr] = runningStartTime.split(":");
    const minutes = parseInt(minutesStr, 10);
    expect(minutes % 5).toBe(0);

    // Verify stopped Alpha task's end time is also divisible by 5 and equals runningStartTime
    const completedRows = taskRows.filter({ hasNotText: "..." });
    await expect(completedRows).toHaveCount(3);

    const newlyStoppedAlphaRow = completedRows.filter({
      has: page.locator(`td:nth-child(3) input[value="${runningStartTime}"]`),
    });
    await expect(newlyStoppedAlphaRow).toHaveCount(1);
    await expect(
      newlyStoppedAlphaRow.locator("td").nth(3).locator("input"),
    ).toHaveValue("Project Alpha");
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
