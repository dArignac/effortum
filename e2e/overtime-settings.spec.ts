import { test, expect } from "@playwright/test";

test.describe("Overtime Settings", () => {
  test("should store overtime settings and persist them after page reload", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for the page to load
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // Open the navigation by clicking the burger menu
    const burgerMenu = page.getByTestId("navigation-burger");
    await burgerMenu.click();
    await expect(page.getByTestId("nav-overtime")).toBeVisible();

    // Navigate to Overtime Settings
    await page.getByTestId("nav-overtime").click();

    // Wait for the overtime form to be visible
    await expect(
      page.getByTestId("overtime-input-current-balance"),
    ).toBeVisible();

    // Fill in overtime settings
    const currentBalanceInput = page.getByTestId(
      "overtime-input-current-balance",
    );
    const workingHoursInput = page.getByTestId("overtime-input-working-hours");
    const submitButton = page.getByTestId("overtime-submit-button");

    // Clear and set current balance to 5 hours
    await currentBalanceInput.clear();
    await currentBalanceInput.fill("5");

    // Clear and set working hours per day to 7.5
    await workingHoursInput.clear();
    await workingHoursInput.fill("7.5");

    // Submit the form
    await submitButton.click();

    // Wait a bit for IndexedDB to persist the data
    await page.waitForTimeout(500);

    // Reload the page to verify persistence
    await page.reload();

    // Wait for the page to load after reload
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // Open the navigation menu again
    await page.getByTestId("navigation-burger").click();
    await expect(page.getByTestId("nav-overtime")).toBeVisible();

    // Navigate back to Overtime Settings
    await page.getByTestId("nav-overtime").click();

    // Wait for the overtime form to be visible again
    await expect(
      page.getByTestId("overtime-input-current-balance"),
    ).toBeVisible();

    // Verify that the values are still present
    await expect(
      page.getByTestId("overtime-input-current-balance"),
    ).toHaveValue("5");
    await expect(page.getByTestId("overtime-input-working-hours")).toHaveValue(
      "7.5",
    );
  });

  test("should update overtime settings when submitting new values", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for the page to load
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // Open the navigation by clicking the burger menu
    const burgerMenu = page.getByTestId("navigation-burger");
    await burgerMenu.click();
    await expect(page.getByTestId("nav-overtime")).toBeVisible();

    // Navigate to Overtime Settings
    await page.getByTestId("nav-overtime").click();

    // Wait for the overtime form to be visible
    await expect(
      page.getByTestId("overtime-input-current-balance"),
    ).toBeVisible();

    // Set initial values
    const currentBalanceInput = page.getByTestId(
      "overtime-input-current-balance",
    );
    const workingHoursInput = page.getByTestId("overtime-input-working-hours");
    const submitButton = page.getByTestId("overtime-submit-button");

    await currentBalanceInput.clear();
    await currentBalanceInput.fill("10");
    await workingHoursInput.clear();
    await workingHoursInput.fill("8");
    await submitButton.click();

    await page.waitForTimeout(500);

    // Update with new values
    await currentBalanceInput.clear();
    await currentBalanceInput.fill("-2.5");
    await workingHoursInput.clear();
    await workingHoursInput.fill("6");
    await submitButton.click();

    await page.waitForTimeout(500);

    // Reload to verify the updated values persisted
    await page.reload();
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // Open the navigation menu again
    await page.getByTestId("navigation-burger").click();
    await expect(page.getByTestId("nav-overtime")).toBeVisible();
    await page.getByTestId("nav-overtime").click();
    await expect(
      page.getByTestId("overtime-input-current-balance"),
    ).toBeVisible();

    // Verify updated values
    await expect(
      page.getByTestId("overtime-input-current-balance"),
    ).toHaveValue("-2.5");
    await expect(page.getByTestId("overtime-input-working-hours")).toHaveValue(
      "6",
    );
  });

  test("should validate working hours per day field", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // Open the navigation by clicking the burger menu
    const burgerMenu = page.getByTestId("navigation-burger");
    await burgerMenu.click();
    await expect(page.getByTestId("nav-overtime")).toBeVisible();

    // Navigate to Overtime Settings
    await page.getByTestId("nav-overtime").click();

    // Wait for the overtime form to be visible
    await expect(
      page.getByTestId("overtime-input-current-balance"),
    ).toBeVisible();

    const workingHoursInput = page.getByTestId("overtime-input-working-hours");
    const submitButton = page.getByTestId("overtime-submit-button");

    // Test invalid value: 0
    await workingHoursInput.clear();
    await workingHoursInput.fill("0");
    await submitButton.click();

    // Should show validation error
    await expect(workingHoursInput).toHaveAttribute("aria-invalid", "true");

    // Test invalid value: negative number
    await workingHoursInput.clear();
    await workingHoursInput.fill("-5");
    await submitButton.click();

    await expect(workingHoursInput).toHaveAttribute("aria-invalid", "true");

    // Test invalid value: more than 24 hours
    await workingHoursInput.clear();
    await workingHoursInput.fill("25");
    await submitButton.click();

    await expect(workingHoursInput).toHaveAttribute("aria-invalid", "true");

    // Test valid value
    await workingHoursInput.clear();
    await workingHoursInput.fill("8");
    await submitButton.click();

    await page.waitForTimeout(300);

    // Should not have validation error
    await expect(workingHoursInput).not.toHaveAttribute("aria-invalid", "true");
  });
});
