import { expect, test } from "@playwright/test";

test.describe("General Settings", () => {
  test("should persist round-to-nearest-5-minutes after page reload", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByTestId("task-list-table")).toBeVisible();

    await page.getByTestId("navigation-burger").click();
    await expect(page.getByTestId("nav-settings")).toBeVisible();
    await page.getByTestId("nav-settings").click();

    const roundToNearest5MinutesSwitch = page.getByRole("switch", {
      name: "Round times to the nearest 5 minutes",
    });
    const submitButton = page.getByTestId("settings-submit-button");

    await expect(roundToNearest5MinutesSwitch).toBeVisible();

    await roundToNearest5MinutesSwitch.check();
    await expect(roundToNearest5MinutesSwitch).toBeChecked();
    await submitButton.click();

    await page.waitForTimeout(500);
    await page.reload();

    await expect(page.getByTestId("task-list-table")).toBeVisible();

    await page.getByTestId("navigation-burger").click();
    await expect(page.getByTestId("nav-settings")).toBeVisible();
    await page.getByTestId("nav-settings").click();

    await expect(roundToNearest5MinutesSwitch).toBeChecked();
  });
});
