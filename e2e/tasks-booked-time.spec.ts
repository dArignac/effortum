import { expect, Page, test } from "@playwright/test";

async function ensureAddButtonIsVisible(page: Page) {
  const addButton = page.getByTestId("button-add-task");
  const isAddButtonVisible = await addButton.isVisible();

  if (!isAddButtonVisible) {
    const emptyEndTimeInput = page.getByTestId("add-entry-input-end-time");
    if (await emptyEndTimeInput.isVisible()) {
      await emptyEndTimeInput.fill("17:00");
      await emptyEndTimeInput.blur();
      await expect(addButton).toBeVisible({ timeout: 5000 });
    }
  }
}

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
  await page.getByTestId("add-entry-input-comment").fill(comment);
  await page.getByTestId("button-add-task").click();
  await expect(page.getByTestId("button-add-task")).toBeVisible({
    timeout: 5000,
  });
}

async function navigateToTasks(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByTestId("navigation-burger").click();
  const tasksNav = page.getByTestId("nav-tasks");
  await expect(tasksNav).toBeVisible();
  await tasksNav.scrollIntoViewIfNeeded();
  await tasksNav.click({ force: true });
  await expect(page.getByTestId("tasks-page")).toBeVisible();
}

async function selectProjectOnTasksPage(page: Page, projectName: string) {
  const selectInput = page.getByTestId("project-select");
  await expect(selectInput).toBeVisible();
  await selectInput.click();
  await selectInput.fill(projectName);
  await page.getByRole("option", { name: projectName }).click();
}

test.describe("Tasks Page - Booked Time", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
  });

  test("should display a cumulative spent time total after task count for each task", async ({
    page,
  }) => {
    const projectName = "BookedTime Project A";

    await addTask(page, projectName, "implementation", "09:00", "11:00");

    await navigateToTasks(page);
    await selectProjectOnTasksPage(page, projectName);

    const firstCount = page.getByTestId("task-comment-count-0");
    await expect(firstCount).toHaveText("1 task, 2.00 h");

    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
    await addTask(page, projectName, "implementation", "13:00", "14:30");

    await page.reload();
    await expect(page.getByTestId("task-list-table")).toBeVisible();
    await navigateToTasks(page);
    await selectProjectOnTasksPage(page, projectName);

    await expect(page.getByTestId("task-comment-count-0")).toHaveText(
      "2 tasks, 3.50 h",
    );
  });

  test("should display correct spent hours across multiple distinct comments", async ({
    page,
  }) => {
    const projectName = "BookedTime Project B";

    await addTask(page, projectName, "design", "08:00", "09:15");
    await addTask(page, projectName, "review", "10:00", "11:00");
    await addTask(page, projectName, "design", "13:00", "14:15");

    await navigateToTasks(page);
    await selectProjectOnTasksPage(page, projectName);

    const commentInputs = page.locator('[data-testid^="task-comment-input-"]');
    const taskCounts = page.locator('[data-testid^="task-comment-count-"]');

    await expect(commentInputs).toHaveCount(2);
    await expect(commentInputs.nth(0)).toHaveValue("design");
    await expect(taskCounts.nth(0)).toHaveText("2 tasks, 2.50 h");

    await expect(commentInputs.nth(1)).toHaveValue("review");
    await expect(taskCounts.nth(1)).toHaveText("1 task, 1.00 h");
  });

  test("should sum spent time across all tasks without applying date filters", async ({
    page,
  }) => {
    const projectName = "BookedTime Project C";

    await addTask(page, projectName, "feature", "09:00", "11:00");

    await ensureAddButtonIsVisible(page);
    await page.getByTestId("add-entry-input-date").click();
    await page.getByRole("button", { name: "Yesterday" }).click();
    await page.getByTestId("add-entry-input-start-time").fill("14:00");
    await page.getByTestId("add-entry-input-end-time").fill("16:00");
    await page.getByTestId("add-entry-input-project").fill(projectName);
    await page.getByTestId("add-entry-input-comment").fill("feature");
    await page.getByTestId("button-add-task").click();
    await expect(page.getByTestId("button-add-task")).toBeVisible({
      timeout: 5000,
    });

    await navigateToTasks(page);
    await selectProjectOnTasksPage(page, projectName);

    await expect(page.getByTestId("task-comment-count-0")).toHaveText(
      "2 tasks, 4.00 h",
    );
  });
});
