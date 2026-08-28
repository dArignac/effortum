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

    // Verify the page content is visible
    await expect(page.getByTestId("tasks-page-header")).toBeVisible();
    await expect(page.getByText("This page is currently empty.")).toBeVisible();
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
