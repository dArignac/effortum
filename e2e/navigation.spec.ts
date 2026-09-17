import { expect, test } from "@playwright/test";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
  });

  test("should show all navigation items after opening burger menu", async ({
    page,
  }) => {
    await page.getByTestId("navigation-burger").click();

    await expect(page.getByTestId("nav-collect-times")).toBeVisible();
    await expect(page.getByTestId("nav-import-export")).toBeVisible();
    await expect(page.getByTestId("nav-settings")).toBeVisible();
    await expect(page.getByTestId("nav-projects")).toBeVisible();
    await expect(page.getByTestId("nav-tasks")).toBeVisible();
    await expect(page.getByTestId("nav-changelog")).toBeVisible();
  });

  test("should navigate to each page via the sidebar", async ({ page }) => {
    // Collect Times (default)
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // Open sidebar
    await page.getByTestId("navigation-burger").click();

    // Import & Export
    await page.getByTestId("nav-import-export").click();
    await expect(page.getByTestId("button-export-data")).toBeVisible();
    await expect(page.getByTestId("button-import-data")).toBeVisible();

    // Settings
    await page.getByTestId("nav-settings").click();
    await expect(
      page.getByTestId("settings-input-round-to-nearest-5-minutes"),
    ).toBeVisible();
    await expect(
      page.getByTestId("overtime-input-current-balance"),
    ).toBeVisible();

    // Projects
    await page.getByTestId("nav-projects").click();
    await expect(page.getByTestId("projects-page")).toBeVisible();

    // Tasks
    await page.getByTestId("nav-tasks").click();
    await expect(page.getByTestId("tasks-page")).toBeVisible();

    // Changelog
    await page.getByTestId("nav-changelog").click();
    await expect(
      page.getByRole("heading", { name: "Changelog" }),
    ).toBeVisible();
  });

  test("should navigate back to Collect Times when clicking Effortum title", async ({
    page,
  }) => {
    // Navigate away from Collect Times first
    await page.getByTestId("navigation-burger").click();
    await page.getByTestId("nav-settings").click();
    await expect(
      page.getByTestId("settings-input-round-to-nearest-5-minutes"),
    ).toBeVisible();

    // Click the Effortum title in the header
    await page.getByText("Effortum").click();

    // Should be back on Collect Times
    await expect(page.getByTestId("task-list-table")).toBeVisible();
  });

  test("should navigate to Changelog when clicking version number", async ({
    page,
  }) => {
    const versionLink = page.getByText(/^v\d+\.\d+\.\d+$/);
    await expect(versionLink).toBeVisible();
    await versionLink.click();

    await expect(
      page.getByRole("heading", { name: "Changelog" }),
    ).toBeVisible();
  });

  test("should toggle burger menu open and closed", async ({ page }) => {
    // Initially nav should be collapsed offscreen
    await expect(page.getByTestId("nav-collect-times")).not.toBeInViewport();

    // Open
    await page.getByTestId("navigation-burger").click();
    await expect(page.getByTestId("nav-collect-times")).toBeInViewport();

    // Close
    await page.getByTestId("navigation-burger").click();
    await expect(page.getByTestId("nav-collect-times")).not.toBeInViewport();
  });
});
