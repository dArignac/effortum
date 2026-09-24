import { expect, test } from "@playwright/test";
import { addTask } from "./utils";

test.describe("Task Autocomplete", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
  });

  test("should suggest existing projects in project autocomplete dropdown and select one", async ({
    page,
  }) => {
    await addTask(page, "AlphaProject", "09:00", "10:00", "First task");
    await addTask(page, "BetaProject", "10:00", "11:00", "Second task");

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
    await addTask(page, "ProjectOne", "09:00", "10:00", "Design review");
    await addTask(page, "ProjectOne", "10:00", "11:00", "Code review");
    await addTask(page, "ProjectTwo", "11:00", "12:00", "Sprint retro");

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
    await addTask(page, "ProjectGamma", "09:00", "10:00", "Frontend testing");

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
    await addTask(page, "ProjectDelta", "09:00", "10:00", "Database indexing");

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
