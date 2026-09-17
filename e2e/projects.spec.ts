import { expect, Page, test } from "@playwright/test";
import { addTask } from "./utils";

async function navigateToProjects(page: Page) {
  await page.getByTestId("navigation-burger").click();
  await expect(page.getByTestId("nav-projects")).toBeVisible();
  await page.getByTestId("nav-projects").click();
  await expect(page.getByTestId("projects-page")).toBeVisible();
}

test.describe("Projects Page", () => {
  test("should show an empty state when there are no projects", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    await navigateToProjects(page);

    await expect(page.getByTestId("projects-empty-state")).toBeVisible();
    await expect(
      page.locator('[data-testid^="project-name-input-"]'),
    ).toHaveCount(0);
  });

  test("should list all projects alphabetically in textfields", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    await addTask(page, "Zeta", "09:00", "10:00");
    await addTask(page, "alpha", "10:15", "11:15");
    await addTask(page, "Beta", "11:30", "12:30");

    await navigateToProjects(page);

    const projectInputs = page.locator('[data-testid^="project-name-input-"]');
    await expect(projectInputs).toHaveCount(3);

    await expect(projectInputs.nth(0)).toHaveValue("alpha");
    await expect(projectInputs.nth(1)).toHaveValue("Beta");
    await expect(projectInputs.nth(2)).toHaveValue("Zeta");
  });

  test("should enable save only on changes and persist renamed project", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    await addTask(page, "Alpha", "09:00", "10:00");
    await navigateToProjects(page);

    const projectInputs = page.locator('[data-testid^="project-name-input-"]');
    const saveButtons = page.locator('[data-testid^="button-save-project-"]');

    await expect(projectInputs).toHaveCount(1);
    await expect(saveButtons).toHaveCount(1);
    await expect(projectInputs.nth(0)).toHaveValue("Alpha");
    await expect(saveButtons.nth(0)).toBeDisabled();

    await projectInputs.nth(0).fill("Alpha");
    await expect(saveButtons.nth(0)).toBeDisabled();

    await projectInputs.nth(0).fill("Alpha Prime");
    await expect(saveButtons.nth(0)).toBeEnabled();

    await saveButtons.nth(0).click();
    await expect(
      page.getByTestId("toast-project-rename-success"),
    ).toBeVisible();
    await expect(projectInputs.nth(0)).toHaveValue("Alpha Prime");
    await expect(saveButtons.nth(0)).toBeDisabled();

    await page.reload();
    await expect(page.getByTestId("task-list-table")).toBeVisible();
    await navigateToProjects(page);
    await expect(projectInputs.nth(0)).toHaveValue("Alpha Prime");
  });

  test("should reject renaming to an already existing project name", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    await addTask(page, "Alpha", "09:00", "10:00");
    await addTask(page, "Beta", "10:15", "11:15");
    await navigateToProjects(page);

    const projectInputs = page.locator('[data-testid^="project-name-input-"]');
    const saveButtons = page.locator('[data-testid^="button-save-project-"]');

    await expect(projectInputs).toHaveCount(2);
    await expect(projectInputs.nth(0)).toHaveValue("Alpha");
    await expect(projectInputs.nth(1)).toHaveValue("Beta");

    await projectInputs.nth(1).fill("Alpha");
    await expect(saveButtons.nth(1)).toBeEnabled();
    await saveButtons.nth(1).click();

    await expect(
      page.getByTestId("toast-project-rename-error-duplicate"),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("task-list-table")).toBeVisible();
    await navigateToProjects(page);

    await expect(projectInputs.nth(0)).toHaveValue("Alpha");
    await expect(projectInputs.nth(1)).toHaveValue("Beta");
  });

  test("should prevent concurrent saves when save is triggered rapidly", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    await addTask(page, "Gamma", "09:00", "10:00");
    await navigateToProjects(page);

    const projectInput = page
      .locator('[data-testid^="project-name-input-"]')
      .nth(0);
    const saveButton = page
      .locator('[data-testid^="button-save-project-"]')
      .nth(0);

    await projectInput.fill("Gamma Prime");
    await expect(saveButton).toBeEnabled();

    await saveButton.dblclick();
    await expect(page.getByTestId("toast-project-rename-success")).toHaveCount(
      1,
    );
    await expect(projectInput).toHaveValue("Gamma Prime");
  });

  test("should disable save button when project name is cleared or reverted", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    await addTask(page, "Delta", "09:00", "10:00");
    await navigateToProjects(page);

    const projectInput = page
      .locator('[data-testid^="project-name-input-"]')
      .nth(0);
    const saveButton = page
      .locator('[data-testid^="button-save-project-"]')
      .nth(0);

    await expect(projectInput).toHaveValue("Delta");
    await expect(saveButton).toBeDisabled();

    // Clear project name
    await projectInput.clear();
    await expect(saveButton).toBeDisabled();

    // Fill with spaces only
    await projectInput.fill("   ");
    await expect(saveButton).toBeDisabled();

    // Revert back to original name
    await projectInput.fill("Delta");
    await expect(saveButton).toBeDisabled();

    // Change to valid new name
    await projectInput.fill("Delta New");
    await expect(saveButton).toBeEnabled();
  });
});
