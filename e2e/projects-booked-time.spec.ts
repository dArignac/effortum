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

async function addTaskWithProject(
  page: Page,
  projectName: string,
  startTime: string,
  endTime: string,
) {
  await ensureAddButtonIsVisible(page);

  await page.getByTestId("add-entry-input-start-time").fill(startTime);
  await page.getByTestId("add-entry-input-end-time").fill(endTime);
  await page.getByTestId("add-entry-input-project").fill(projectName);
  await page.getByTestId("button-add-task").click();
  await expect(page.getByTestId("button-add-task")).toBeVisible({
    timeout: 5000,
  });
}

async function navigateToProjects(page: Page) {
  await page.getByTestId("navigation-burger").click();
  await expect(page.getByTestId("nav-projects")).toBeVisible();
  await page.getByTestId("nav-projects").click();
  await expect(page.getByTestId("projects-page")).toBeVisible();
}

async function getProjectRowByName(page: Page, projectName: string) {
  const rows = page.locator('[data-testid^="project-row-"]');
  const count = await rows.count();

  for (let index = 0; index < count; index++) {
    const row = rows.nth(index);
    const projectInput = row.locator('[data-testid^="project-name-input-"]');

    if ((await projectInput.inputValue()).trim() === projectName) {
      return row;
    }
  }

  throw new Error(`Could not find a project row for "${projectName}"`);
}

test.describe("Projects Page - Booked Time", () => {
  test("should display a cumulative booked time total for the project", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    await addTaskWithProject(page, "Alpha", "09:00", "11:00");

    await navigateToProjects(page);

    const alphaRow = await getProjectRowByName(page, "Alpha");
    await expect(
      alphaRow.locator('[data-testid^="project-task-hours-sum-"]'),
    ).toHaveText("2.00 h");

    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
    await addTaskWithProject(page, "Alpha", "13:00", "14:00");

    await page.reload();
    await expect(page.getByTestId("task-list-table")).toBeVisible();
    await navigateToProjects(page);

    const reloadedAlphaRow = await getProjectRowByName(page, "Alpha");
    await expect(
      reloadedAlphaRow.locator('[data-testid^="project-task-hours-sum-"]'),
    ).toHaveText("3.00 h");
  });
});
