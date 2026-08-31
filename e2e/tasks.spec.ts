import { expect, test } from "@playwright/test";

test.describe("Tasks Page Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should navigate to Tasks page from main navigation", async ({
    page,
  }) => {
    const burgerButton = page.getByTestId("navigation-burger");
    await burgerButton.click();

    // Click on the "Tasks" navigation link
    await page.getByTestId("nav-tasks").click();

    // Verify we are on the Tasks page
    await expect(page.getByTestId("tasks-page")).toBeVisible();

    // Verify the page content is visible - now should show project selection instead of empty message
    await expect(page.getByTestId("tasks-page-header")).toBeVisible();
  });

  test("should maintain navigation state when switching between pages", async ({
    page,
  }) => {
    const burgerButton = page.getByTestId("navigation-burger");
    await burgerButton.click();

    // Navigate to Projects page first
    await page.getByTestId("nav-projects").click();
    await expect(page.getByTestId("projects-page")).toBeVisible();

    // Then navigate to Tasks page
    await page.getByTestId("nav-tasks").click();
    await expect(page.getByTestId("tasks-page")).toBeVisible();

    // Verify we're on the Tasks page
    await expect(page.getByTestId("tasks-page-header")).toBeVisible();
  });
});

test.describe("Tasks Page - Project Selection and Task Filtering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Navigate to Tasks page
    const burgerButton = page.getByTestId("navigation-burger");
    await burgerButton.click();
    await page.getByTestId("nav-tasks").click();

    // Wait for the page to load completely
    await expect(page.getByTestId("tasks-page")).toBeVisible();
  });

  test("should show no projects message when no projects exist", async ({
    page,
  }) => {
    // Check that we show a message about no projects available (the default behavior)
    const noProjectsMessage = page.getByText("No projects available. Create a project first.");
    await expect(noProjectsMessage).toBeVisible();
  });

  test("should allow navigation to Projects page from Tasks page", async ({
    page,
  }) => {
    // Verify we can navigate to projects page from tasks
    await page.getByTestId("nav-projects").click();
    await expect(page.getByTestId("projects-page")).toBeVisible();
  });
});
