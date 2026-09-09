import { expect, Page, test } from "@playwright/test";

async function navigateToTasks(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByTestId("navigation-burger").click();
  const tasksNav = page.getByTestId("nav-tasks");
  await expect(tasksNav).toBeVisible();
  await tasksNav.scrollIntoViewIfNeeded();
  await tasksNav.click({ force: true });
  await expect(page.getByTestId("tasks-page")).toBeVisible();
}

async function addTask(
  page: Page,
  projectName: string,
  comment: string,
  startTime: string,
  endTime: string,
) {
  await page.getByTestId("add-entry-input-start-time").fill(startTime);
  await page.getByTestId("add-entry-input-end-time").fill(endTime);
  await page.getByTestId("add-entry-input-project").fill(projectName);
  await page.getByTestId("add-entry-input-comment").fill(comment);
  await page.getByTestId("button-add-task").click();
  await expect(page.getByTestId("button-add-task")).toBeVisible();
}

async function selectProjectOnTasksPage(page: Page, projectName: string) {
  const selectInput = page.getByTestId("project-select");
  await expect(selectInput).toBeVisible();
  await selectInput.click();
  await selectInput.fill(projectName);
  await page.getByRole("option", { name: projectName }).click();
}

test.describe("Tasks Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
  });

  test("should display correct navigation items", async ({ page }) => {
    await page.getByTestId("navigation-burger").click();

    await expect(page.getByTestId("nav-projects")).toBeVisible();
    await expect(page.getByTestId("nav-tasks")).toBeVisible();
    await expect(page.getByTestId("nav-changelog")).toBeVisible();
  });

  test("should display project selection and no tasks when no project selected", async ({
    page,
  }) => {
    await navigateToTasks(page);

    await expect(page.getByText("Task Management")).toBeVisible();
    await expect(page.getByTestId("project-select")).toBeVisible();
    await expect(page.getByTestId("tasks-no-project-selected")).toBeVisible();
  });

  test("should display tasks for selected project", async ({ page }) => {
    const projectName = "Tasks Project A";

    await addTask(page, projectName, "meeting", "09:00", "10:00");
    await addTask(page, projectName, "meeting", "10:15", "11:00");
    await addTask(page, projectName, "review", "11:15", "12:00");

    await navigateToTasks(page);
    await selectProjectOnTasksPage(page, projectName);

    await expect(page.getByTestId("tasks-list-label")).toHaveText("Tasks");

    const commentRows = page.locator('[data-testid^="task-comment-row-"]');
    await expect(commentRows).toHaveCount(2);

    const commentInputs = page.locator('[data-testid^="task-comment-input-"]');
    await expect(commentInputs.nth(0)).toHaveValue("meeting");
    await expect(commentInputs.nth(1)).toHaveValue("review");

    const taskCounts = page.locator('[data-testid^="task-comment-count-"]');
    await expect(taskCounts).toHaveCount(2);
    await expect(taskCounts.nth(0)).toHaveText("2 tasks, 1.75 h");
    await expect(taskCounts.nth(1)).toHaveText("1 task, 0.75 h");
  });

  test("should place task count between comment input and save button for each row", async ({
    page,
  }) => {
    const projectName = "Tasks Project D";

    await addTask(page, projectName, "analysis", "09:00", "10:00");
    await addTask(page, projectName, "analysis", "10:15", "11:00");

    await navigateToTasks(page);
    await selectProjectOnTasksPage(page, projectName);

    const row = page.getByTestId("task-comment-row-0");
    const input = row.getByTestId("task-comment-input-0");
    const count = row.getByTestId("task-comment-count-0");
    const saveButton = row.getByTestId("button-save-task-comment-0");

    await expect(input).toBeVisible();
    await expect(count).toHaveText("2 tasks, 1.75 h");
    await expect(saveButton).toBeVisible();

    const inputBox = await input.boundingBox();
    const countBox = await count.boundingBox();
    const saveButtonBox = await saveButton.boundingBox();

    expect(inputBox).not.toBeNull();
    expect(countBox).not.toBeNull();
    expect(saveButtonBox).not.toBeNull();
    expect(inputBox?.x ?? 0).toBeLessThan(countBox?.x ?? 0);
    expect(countBox?.x ?? 0).toBeLessThan(saveButtonBox?.x ?? 0);
  });

  test("should keep comment input widths equal across rows with different task counts", async ({
    page,
  }) => {
    const projectName = "Tasks Project E";

    for (let i = 0; i < 12; i++) {
      const startHour = 8 + i;
      await addTask(
        page,
        projectName,
        "bulk",
        `${startHour.toString().padStart(2, "0")}:00`,
        `${startHour.toString().padStart(2, "0")}:30`,
      );
    }
    await addTask(page, projectName, "single", "21:00", "21:30");

    await navigateToTasks(page);
    await selectProjectOnTasksPage(page, projectName);

    const firstInput = page.getByTestId("task-comment-input-0");
    const secondInput = page.getByTestId("task-comment-input-1");
    await expect(firstInput).toBeVisible();
    await expect(secondInput).toBeVisible();

    const firstWidth = (await firstInput.boundingBox())?.width;
    const secondWidth = (await secondInput.boundingBox())?.width;

    expect(firstWidth).toBeDefined();
    expect(secondWidth).toBeDefined();
    expect(
      Math.abs((firstWidth ?? 0) - (secondWidth ?? 0)),
    ).toBeLessThanOrEqual(1);
  });

  test("should allow editing task comments and save successfully", async ({
    page,
  }) => {
    const projectName = "Tasks Project B";

    await addTask(page, projectName, "meeting", "09:00", "10:00");
    await addTask(page, projectName, "meeting", "10:15", "11:00");
    await addTask(page, projectName, "review", "11:15", "12:00");

    await navigateToTasks(page);
    await selectProjectOnTasksPage(page, projectName);

    const firstCommentInput = page.getByTestId("task-comment-input-0");
    const firstSaveButton = page.getByTestId("button-save-task-comment-0");

    await expect(firstCommentInput).toHaveValue("meeting");
    await expect(firstSaveButton).toBeDisabled();

    await firstCommentInput.fill("planning");
    await expect(firstSaveButton).toBeEnabled();

    await firstSaveButton.click();
    await expect(
      page.getByTestId("toast-task-comment-update-success"),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    await navigateToTasks(page);
    await selectProjectOnTasksPage(page, projectName);

    const commentInputs = page.locator('[data-testid^="task-comment-input-"]');
    await expect(commentInputs).toHaveCount(2);
    await expect(commentInputs.nth(0)).toHaveValue("planning");
    await expect(commentInputs.nth(1)).toHaveValue("review");
  });

  test("should show error when trying to save duplicate task comments", async ({
    page,
  }) => {
    const projectName = "Tasks Project C";

    await addTask(page, projectName, "analysis", "09:00", "10:00");
    await addTask(page, projectName, "analysis", "10:15", "11:00");
    await addTask(page, projectName, "sync", "11:15", "12:00");

    await navigateToTasks(page);
    await selectProjectOnTasksPage(page, projectName);

    const firstCommentInput = page.getByTestId("task-comment-input-0");
    const firstSaveButton = page.getByTestId("button-save-task-comment-0");

    await expect(firstCommentInput).toHaveValue("analysis");
    await firstCommentInput.fill("sync");
    await expect(firstSaveButton).toBeEnabled();

    await firstSaveButton.click();
    await expect(
      page.getByTestId("toast-task-comment-update-error-duplicate"),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    await navigateToTasks(page);
    await selectProjectOnTasksPage(page, projectName);

    const commentInputs = page.locator('[data-testid^="task-comment-input-"]');
    await expect(commentInputs).toHaveCount(2);
    await expect(commentInputs.nth(0)).toHaveValue("analysis");
    await expect(commentInputs.nth(1)).toHaveValue("sync");
  });
});
