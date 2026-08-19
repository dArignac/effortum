import { expect, test, type Page } from "@playwright/test";

test.describe("Changelog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
  });

  async function openMainNavigation(page: Page) {
    await page.getByTestId("navigation-burger").click();
    await expect(page.getByTestId("nav-changelog")).toBeVisible();
  }

  test("should reach changelog through main navigation", async ({ page }) => {
    await openMainNavigation(page);
    await page.getByTestId("nav-changelog").click();

    await expect(
      page.getByRole("heading", { name: "Changelog" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Version" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Description" }),
    ).toBeVisible();

    const firstVersionCell = page
      .locator("tbody tr")
      .first()
      .locator("td")
      .first();
    await expect(firstVersionCell).toHaveText(/\d+\.\d+\.\d+/);
  });

  test("should reach changelog by clicking the version number", async ({
    page,
  }) => {
    const versionLink = page.getByText(/^v\d+\.\d+\.\d+$/);

    await expect(versionLink).toBeVisible();
    await versionLink.click();

    await expect(
      page.getByRole("heading", { name: "Changelog" }),
    ).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("should render changelog entries with expected versions", async ({
    page,
  }) => {
    await openMainNavigation(page);
    await page.getByTestId("nav-changelog").click();

    await expect(
      page.locator("tbody tr td").filter({ hasText: "0.10.0" }),
    ).toBeVisible();
    await expect(
      page.locator("tbody tr td").filter({ hasText: "0.9.2" }),
    ).toBeVisible();
    await expect(
      page.locator("tbody tr td").filter({ hasText: "0.6.2" }),
    ).toBeVisible();
  });

  test("should render issue references as secure external links", async ({
    page,
  }) => {
    await openMainNavigation(page);
    await page.getByTestId("nav-changelog").click();

    const issueRow = page.locator("tbody tr", {
      has: page.locator("td", { hasText: "0.9.2" }),
    });
    const issueLink = issueRow.getByRole("link", { name: "Issue #3" });

    await expect(issueLink).toBeVisible();
    await expect(issueLink).toHaveAttribute(
      "href",
      "https://github.com/darignac/effortum/issues/3",
    );
    await expect(issueLink).toHaveAttribute("target", "_blank");
    await expect(issueLink).toHaveAttribute("rel", "noreferrer noopener");
  });

  test("should render multi-line descriptions as bullet lists", async ({
    page,
  }) => {
    await openMainNavigation(page);
    await page.getByTestId("nav-changelog").click();

    const multiLineRow = page.locator("tbody tr", {
      has: page.locator("td", { hasText: "0.9.2" }),
    });
    const descriptionCell = multiLineRow.locator("td").nth(1);
    const bulletItems = descriptionCell.getByRole("listitem");

    await expect(bulletItems).toHaveCount(2);
    await expect(bulletItems.nth(0)).toContainText(
      "Technical: Adds db table for settings only.",
    );
    await expect(bulletItems.nth(1)).toContainText(
      "This is to evaluate if we run into database migration issues",
    );
  });
});
