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
  if (comment) {
    await page.getByTestId("add-entry-input-comment").fill(comment);
  }
  await page.getByTestId("button-add-task").click();
  await expect(page.getByTestId("button-add-task")).toBeVisible({
    timeout: 5000,
  });
}

test.describe("Task Autocomplete", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
  });

  test("should suggest existing projects in project autocomplete dropdown and select one", async ({
    page,
  }) => {
    await addTask(page, "AlphaProject", "First task", "09:00", "10:00");
    await addTask(page, "BetaProject", "Second task", "10:00", "11:00");

    const projectInput = page.getByTestId("add-entry-input-project");
    await projectInput.click();
    await projectInput.fill("Alpha");

    const option = page.getByRole("option", { name: "AlphaProject" });
    await expect(option).toBeVisible();
    await option.click();

    await expect(projectInput).toHaveValue("AlphaProject");
  });

  test("should suggest only comments for the selected project", async ({
    page,
  }) => {
    await addTask(page, "ProjectOne", "Design review", "09:00", "10:00");
    await addTask(page, "ProjectOne", "Code review", "10:00", "11:00");
    await addTask(page, "ProjectTwo", "Sprint retro", "11:00", "12:00");

    const projectInput = page.getByTestId("add-entry-input-project");
    await projectInput.fill("ProjectOne");

    const commentInput = page.getByTestId("add-entry-input-comment");
    await commentInput.clear();
    await commentInput.click();

    // Should see options for ProjectOne
    await expect(
      page.getByRole("option", { name: "Design review" }),
    ).toBeVisible();
    await expect(
      page.getByRole("option", { name: "Code review" }),
    ).toBeVisible();

    // Should NOT see comments from ProjectTwo
    await expect(
      page.getByRole("option", { name: "Sprint retro" }),
    ).not.toBeVisible();
  });

  test("should populate comment input when an autocomplete option is clicked", async ({
    page,
  }) => {
    await addTask(page, "ProjectGamma", "Frontend testing", "09:00", "10:00");

    const projectInput = page.getByTestId("add-entry-input-project");
    await projectInput.fill("ProjectGamma");

    const commentInput = page.getByTestId("add-entry-input-comment");
    await commentInput.click();

    const option = page.getByRole("option", { name: "Frontend testing" });
    await expect(option).toBeVisible();
    await option.click();

    await expect(commentInput).toHaveValue("Frontend testing");
  });

  test("should clear comment suggestions when project input is cleared", async ({
    page,
  }) => {
    await addTask(page, "ProjectDelta", "Database indexing", "09:00", "10:00");

    const projectInput = page.getByTestId("add-entry-input-project");
    await projectInput.fill("ProjectDelta");

    const commentInput = page.getByTestId("add-entry-input-comment");
    await commentInput.click();
    await expect(
      page.getByRole("option", { name: "Database indexing" }),
    ).toBeVisible();

    // Clear project input
    await projectInput.clear();
    await commentInput.click();

    // No options should be shown since project is empty
    await expect(
      page.getByRole("option", { name: "Database indexing" }),
    ).not.toBeVisible();
  });
});
