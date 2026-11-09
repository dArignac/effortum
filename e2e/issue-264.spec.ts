import { expect, Page, test } from "@playwright/test";
import { addTask, getTodayIso } from "./utils";

async function navigateToBudgets(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByTestId("navigation-burger").click();
  const budgetsNav = page.getByTestId("nav-budgets");
  await expect(budgetsNav).toBeVisible();
  await budgetsNav.scrollIntoViewIfNeeded();
  await budgetsNav.click({ force: true });
  await expect(page.getByTestId("budgets-page")).toBeVisible();
}

async function selectProjectOnBudgetsPage(page: Page, projectName: string) {
  const selectInput = page.getByTestId("budget-project-select");
  await expect(selectInput).toBeVisible();
  await selectInput.click();
  await selectInput.fill(projectName);
  await page.getByRole("option", { name: projectName }).click();
}

test.describe("Issue #264: Project Budget Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
  });

  test("adds multiple budgets, sorts newest first, displays per-budget metrics without overall summary, and supports editing and confirmed deletion", async ({
    page,
  }) => {
    const projectName = "Budget Alpha";
    const today = getTodayIso();

    // Book 4 hours today on "Budget Alpha" (08:00 -> 12:00)
    await addTask(page, projectName, "08:00", "12:00", "Implementation");

    await navigateToBudgets(page);
    await expect(page.getByTestId("budgets-no-project-selected")).toBeVisible();

    await selectProjectOnBudgetsPage(page, projectName);
    await expect(page.getByTestId("budgets-empty-state")).toBeVisible();
    await expect(
      page.getByTestId("project-budget-overall-summary"),
    ).toHaveCount(0);

    // 1. Add an older budget (outside today's range): 2020-01-01 .. 2020-03-31, 40h
    await page.getByTestId("add-budget-start-date").fill("2020-01-01");
    await page.getByTestId("add-budget-end-date").fill("2020-03-31");
    await page.getByTestId("add-budget-purpose").fill("Legacy Phase");
    await page.getByTestId("add-budget-hours").fill("40");
    await page.getByTestId("button-add-budget").click();
    await expect(page.getByTestId("toast-budget-add-success")).toBeVisible();

    // 2. Add a newer budget (covering today): today .. today, 16h
    await page.getByTestId("add-budget-start-date").fill(today);
    await page.getByTestId("add-budget-end-date").fill(today);
    await page.getByTestId("add-budget-purpose").fill("Current Sprint");
    await page.getByTestId("add-budget-hours").fill("16");
    await page.getByTestId("button-add-budget").click();

    const budgetRows = page.locator('[data-testid^="budget-row-"]');
    await expect(budgetRows).toHaveCount(2);
    await expect(
      page.getByTestId("project-budget-overall-summary"),
    ).toHaveCount(0);

    // Verify newest-first sorting by startDate:
    // Row 0 should be "Current Sprint" (today), Row 1 should be "Legacy Phase" (2020-01-01)
    const purposeInputs = page.locator(
      '[data-testid^="budget-purpose-input-"]',
    );
    await expect(purposeInputs.nth(0)).toHaveValue("Current Sprint");
    await expect(purposeInputs.nth(1)).toHaveValue("Legacy Phase");

    // Verify per-row metrics:
    // Row 0 (Current Sprint, covers today): 4/16 h (0.5/2 days) · 25%
    // Row 1 (Legacy Phase, 2020): 0/40 h (0/5 days) · 0%
    const rowMetrics = page.locator('[data-testid^="budget-metrics-"]');
    await expect(rowMetrics.nth(0)).toHaveText("4/16 h (0.5/2 days) · 25%");
    await expect(rowMetrics.nth(1)).toHaveText("0/40 h (0/5 days) · 0%");

    // 3. Edit Row 0 ("Current Sprint") hours from 16 -> 8 and purpose -> "Current Sprint Updated"
    const hoursInputs = page.locator('[data-testid^="budget-hours-input-"]');
    const saveButtons = page.locator('[data-testid^="button-save-budget-"]');
    await expect(saveButtons.nth(0)).toBeDisabled();

    await purposeInputs.nth(0).fill("Current Sprint Updated");
    await hoursInputs.nth(0).fill("8");
    await expect(saveButtons.nth(0)).toBeEnabled();
    await saveButtons.nth(0).click();

    await expect(page.getByTestId("toast-budget-update-success")).toBeVisible();
    await expect(saveButtons.nth(0)).toBeDisabled();

    // Updated Row 0 metrics: 4/8 h (0.5/1 days) · 50%
    await expect(rowMetrics.nth(0)).toHaveText("4/8 h (0.5/1 days) · 50%");

    // 4. Reload and verify persistence
    await page.reload();
    await expect(page.getByTestId("task-list-table")).toBeVisible();
    await navigateToBudgets(page);
    await selectProjectOnBudgetsPage(page, projectName);

    await expect(budgetRows).toHaveCount(2);
    await expect(purposeInputs.nth(0)).toHaveValue("Current Sprint Updated");
    await expect(rowMetrics.nth(0)).toHaveText("4/8 h (0.5/1 days) · 50%");

    // 5. Delete the older budget (Row 1) with confirmation modal (first cancel, then confirm)
    const deleteButtons = page.locator(
      '[data-testid^="button-delete-budget-"]',
    );
    await deleteButtons.nth(1).click();
    await expect(page.getByTestId("modal-delete-budget")).toBeVisible();

    await page.getByTestId("button-cancel-delete-budget").click();
    await expect(page.getByTestId("modal-delete-budget")).toBeHidden();
    await expect(budgetRows).toHaveCount(2);

    await deleteButtons.nth(1).click();
    await expect(page.getByTestId("modal-delete-budget")).toBeVisible();
    await page.getByTestId("button-confirm-delete-budget").click();
    await expect(page.getByTestId("toast-budget-delete-success")).toBeVisible();

    await expect(budgetRows).toHaveCount(1);
    await expect(purposeInputs.nth(0)).toHaveValue("Current Sprint Updated");
  });
});
