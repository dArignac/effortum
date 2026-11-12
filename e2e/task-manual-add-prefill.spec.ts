import { expect, test } from "@playwright/test";

test.describe("Prefill start time on manual finished task addition", () => {
  test("prefills start time with end time and resets end, project, and comment while keeping selected date", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    const dateInput = page.getByTestId("add-entry-input-date");
    const startInput = page.getByTestId("add-entry-input-start-time");
    const endInput = page.getByTestId("add-entry-input-end-time");
    const projectInput = page.getByTestId("add-entry-input-project");
    const commentInput = page.getByTestId("add-entry-input-comment");
    const addButton = page.getByTestId("button-add-task");

    const initialDate = await dateInput.textContent();
    expect(initialDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await startInput.fill("09:00");
    await endInput.fill("10:30");
    await projectInput.fill("Project Alpha");
    await commentInput.fill("Morning session");
    await addButton.click();

    const taskRows = page.locator('[data-testid^="task-row-"]');
    await expect(taskRows).toHaveCount(1);
    await expect(
      taskRows.first().locator("td").nth(1).locator("input"),
    ).toHaveValue("09:00");
    await expect(
      taskRows.first().locator("td").nth(2).locator("input"),
    ).toHaveValue("10:30");
    await expect(
      taskRows.first().locator("td").nth(3).locator("input"),
    ).toHaveValue("Project Alpha");
    await expect(
      taskRows.first().locator("td").nth(4).locator("input"),
    ).toHaveValue("Morning session");

    await expect(startInput).toHaveValue("10:30");
    await expect(endInput).toHaveValue("");
    await expect(projectInput).toHaveValue("");
    await expect(commentInput).toHaveValue("");
    await expect(dateInput).toHaveText(initialDate!);

    // Also verify non-today date selection is preserved on manual add
    await dateInput.click();
    await page.getByRole("button", { name: "Yesterday" }).click();
    const yesterdayDate = await dateInput.textContent();
    expect(yesterdayDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await endInput.fill("11:15");
    await projectInput.fill("Yesterday Project");
    await commentInput.fill("Backfill note");
    await addButton.click();

    await expect(startInput).toHaveValue("11:15");
    await expect(endInput).toHaveValue("");
    await expect(projectInput).toHaveValue("");
    await expect(commentInput).toHaveValue("");
    await expect(dateInput).toHaveText(yesterdayDate!);

    // Navigating away and returning preserves prefilled start time via store state
    await page.getByTestId("navigation-burger").click();
    await page.getByTestId("nav-settings").click();
    await expect(
      page.getByTestId("settings-input-round-to-nearest-5-minutes"),
    ).toBeVisible();

    await page.getByText("Effortum").click();
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    await expect(startInput).toHaveValue("11:15");
    await expect(endInput).toHaveValue("");
    await expect(projectInput).toHaveValue("");
    await expect(commentInput).toHaveValue("");
  });

  test("chains prefilled start time across consecutive manual finished task additions", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    const startInput = page.getByTestId("add-entry-input-start-time");
    const endInput = page.getByTestId("add-entry-input-end-time");
    const projectInput = page.getByTestId("add-entry-input-project");
    const commentInput = page.getByTestId("add-entry-input-comment");
    const addButton = page.getByTestId("button-add-task");
    const taskRows = page.locator('[data-testid^="task-row-"]');

    // Task 1
    await startInput.fill("08:00");
    await endInput.fill("09:15");
    await projectInput.fill("Project One");
    await commentInput.fill("First task");
    await addButton.click();

    await expect(taskRows).toHaveCount(1);
    await expect(startInput).toHaveValue("09:15");
    await expect(endInput).toHaveValue("");
    await expect(projectInput).toHaveValue("");
    await expect(commentInput).toHaveValue("");

    // Task 2: use prefilled start time 09:15 without re-entering start
    await endInput.fill("10:45");
    await projectInput.fill("Project Two");
    await commentInput.fill("Second task");
    await addButton.click();

    await expect(taskRows).toHaveCount(2);
    await expect(
      taskRows.nth(1).locator("td").nth(1).locator("input"),
    ).toHaveValue("09:15");
    await expect(
      taskRows.nth(1).locator("td").nth(2).locator("input"),
    ).toHaveValue("10:45");
    await expect(
      taskRows.nth(1).locator("td").nth(3).locator("input"),
    ).toHaveValue("Project Two");
    await expect(
      taskRows.nth(1).locator("td").nth(4).locator("input"),
    ).toHaveValue("Second task");

    await expect(startInput).toHaveValue("10:45");
    await expect(endInput).toHaveValue("");
    await expect(projectInput).toHaveValue("");
    await expect(commentInput).toHaveValue("");

    // Task 3: use prefilled start time 10:45 with empty comment
    await endInput.fill("12:00");
    await projectInput.fill("Project Three");
    await addButton.click();

    await expect(taskRows).toHaveCount(3);
    await expect(
      taskRows.nth(2).locator("td").nth(1).locator("input"),
    ).toHaveValue("10:45");
    await expect(
      taskRows.nth(2).locator("td").nth(2).locator("input"),
    ).toHaveValue("12:00");
    await expect(
      taskRows.nth(2).locator("td").nth(3).locator("input"),
    ).toHaveValue("Project Three");
    await expect(
      taskRows.nth(2).locator("td").nth(4).locator("input"),
    ).toHaveValue("");

    await expect(startInput).toHaveValue("12:00");
    await expect(endInput).toHaveValue("");
    await expect(projectInput).toHaveValue("");
    await expect(commentInput).toHaveValue("");
  });

  test("prefills start time with 5-minute rounded end time when roundToNearest5Minutes is enabled", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

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

    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    const startInput = page.getByTestId("add-entry-input-start-time");
    const endInput = page.getByTestId("add-entry-input-end-time");
    const projectInput = page.getByTestId("add-entry-input-project");
    const commentInput = page.getByTestId("add-entry-input-comment");
    const addButton = page.getByTestId("button-add-task");

    await startInput.fill("09:01");
    await endInput.fill("10:04");
    await projectInput.fill("Rounded Project");
    await commentInput.fill("Rounded note");
    await addButton.click();

    const taskRow = page.locator('[data-testid^="task-row-"]').first();
    await expect(taskRow).toBeVisible();
    await expect(taskRow.locator("td").nth(1).locator("input")).toHaveValue(
      "09:00",
    );
    await expect(taskRow.locator("td").nth(2).locator("input")).toHaveValue(
      "10:05",
    );

    await expect(startInput).toHaveValue("10:05");
    await expect(endInput).toHaveValue("");
    await expect(projectInput).toHaveValue("");
    await expect(commentInput).toHaveValue("");
  });

  test("clears start, end, project, and comment without prefilling start time when an active task is running on another date", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // Start an incomplete active task on yesterday
    await page.getByTestId("add-entry-input-date").click();
    await page.getByRole("button", { name: "Yesterday" }).click();
    await page.getByTestId("add-entry-input-start-time").fill("08:30");
    await page.getByTestId("add-entry-input-end-time").clear();
    await page.getByTestId("add-entry-input-project").fill("Yesterday Active");
    await page.getByTestId("add-entry-input-comment").fill("Still running");
    await page.getByTestId("button-add-task").click();

    // Reload so today's date view is active while yesterday's task remains running
    await page.reload();
    await expect(page.getByTestId("task-list-table")).toBeVisible();
    await expect(page.getByTestId("active-task-alert")).toBeVisible();

    const startInput = page.getByTestId("add-entry-input-start-time");
    const endInput = page.getByTestId("add-entry-input-end-time");
    const projectInput = page.getByTestId("add-entry-input-project");
    const commentInput = page.getByTestId("add-entry-input-comment");
    const addButton = page.getByTestId("button-add-task");

    await startInput.fill("10:00");
    await endInput.fill("11:30");
    await projectInput.fill("Today Finished");
    await commentInput.fill("Completed task");
    await addButton.click();

    await expect(page.locator('[data-testid^="task-row-"]')).toHaveCount(1);

    await expect(startInput).toHaveValue("");
    await expect(endInput).toHaveValue("");
    await expect(projectInput).toHaveValue("");
    await expect(commentInput).toHaveValue("");
  });

  test("updates prefilled start time when just-added finished task end time is adjusted unless user typed a custom start time", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    const startInput = page.getByTestId("add-entry-input-start-time");
    const endInput = page.getByTestId("add-entry-input-end-time");
    const projectInput = page.getByTestId("add-entry-input-project");
    const commentInput = page.getByTestId("add-entry-input-comment");
    const addButton = page.getByTestId("button-add-task");

    await startInput.fill("13:00");
    await endInput.fill("14:00");
    await projectInput.fill("Adjust Project");
    await commentInput.fill("Initial entry");
    await addButton.click();

    const taskRow = page.locator('[data-testid^="task-row-"]').first();
    await expect(taskRow).toBeVisible();
    await expect(startInput).toHaveValue("14:00");

    // Adjusting the just-added task's end time updates the prefilled start time
    const rowEndInput = taskRow.locator("td").nth(2).locator("input");
    const updateButton = taskRow.locator(
      '[data-testid^="button-update-task-"]',
    );

    await rowEndInput.fill("14:25");
    await updateButton.click();
    await expect(startInput).toHaveValue("14:25");

    // Once user types a custom start time, subsequent row edits preserve it
    await startInput.fill("15:00");
    await expect(startInput).toHaveValue("15:00");

    await rowEndInput.fill("14:40");
    await updateButton.click();
    await expect(startInput).toHaveValue("15:00");
  });

  test("does not leave a stuck loading indicator in the comment field after adding a finished task", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    const startInput = page.getByTestId("add-entry-input-start-time");
    const endInput = page.getByTestId("add-entry-input-end-time");
    const projectInput = page.getByTestId("add-entry-input-project");
    const commentInput = page.getByTestId("add-entry-input-comment");
    const addButton = page.getByTestId("button-add-task");
    const commentLoader = commentInput
      .locator("..")
      .locator(".mantine-Loader-root");

    await startInput.fill("09:00");
    await endInput.fill("10:00");
    await projectInput.fill("Loader Project");
    await commentInput.fill("Initial work");
    await addButton.click();

    await expect(page.locator('[data-testid^="task-row-"]')).toHaveCount(1);
    await expect(startInput).toHaveValue("10:00");
    await expect(commentInput).toHaveValue("");
    await expect(commentLoader).toHaveCount(0);

    // Also verify when adding a second task on an already-existing project
    await endInput.fill("11:00");
    await projectInput.fill("Loader Project");
    await commentInput.fill("Follow-up work");
    await addButton.click();

    await expect(page.locator('[data-testid^="task-row-"]')).toHaveCount(2);
    await expect(startInput).toHaveValue("11:00");
    await expect(commentInput).toHaveValue("");
    await expect(commentLoader).toHaveCount(0);
  });
});
