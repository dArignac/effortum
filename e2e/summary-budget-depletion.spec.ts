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

async function navigateToTimeCollector(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByText("Effortum", { exact: true }).click();
  await expect(page.getByTestId("task-list-table")).toBeVisible();
}

async function selectProjectOnBudgetsPage(page: Page, projectName: string) {
  const selectInput = page.getByTestId("budget-project-select");
  await expect(selectInput).toBeVisible();
  await selectInput.click();
  await selectInput.fill(projectName);
  await page.getByRole("option", { name: projectName }).click();
}

async function addBudgetOnBudgetsPage(
  page: Page,
  startDate: string,
  endDate: string,
  purpose: string,
  hours: string,
  expectedRowCount?: number,
) {
  await page.getByTestId("add-budget-start-date").fill(startDate);
  await page.getByTestId("add-budget-end-date").fill(endDate);
  await page.getByTestId("add-budget-purpose").fill(purpose);
  await page.getByTestId("add-budget-hours").fill(hours);
  await page.getByTestId("button-add-budget").click();

  if (expectedRowCount !== undefined) {
    await expect(page.locator('[data-testid^="budget-row-"]')).toHaveCount(
      expectedRowCount,
    );
  } else {
    await expect(
      page.getByTestId("toast-budget-add-success").last(),
    ).toBeVisible();
  }
}

test.describe("Summary Panel Budget Depletion (#265)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
  });

  test("should display project budget depletion percentage and hover tooltip below project name", async ({
    page,
  }) => {
    const today = getTodayIso();
    const projectName = "Alpha Project";

    // 1. Add 3 hours on Alpha Project today (08:00 - 11:00)
    await addTask(page, projectName, "08:00", "11:00", "Feature Dev");

    // Before adding any budget, budget depletion should not be visible
    await expect(
      page.getByTestId(`summary-budget-depletion-${projectName}`),
    ).not.toBeVisible();

    // 2. Navigate to Budgets and add a 10h budget covering today
    await navigateToBudgets(page);
    await selectProjectOnBudgetsPage(page, projectName);
    await addBudgetOnBudgetsPage(
      page,
      today,
      today,
      "Current Iteration",
      "10",
      1,
    );

    // 3. Return to Time Collector
    await navigateToTimeCollector(page);

    // Depletion should now be rendered: 3h / 10h = 30%
    const depletionElement = page.getByTestId(
      `summary-budget-depletion-${projectName}`,
    );
    await expect(depletionElement).toBeVisible();
    await expect(depletionElement).toHaveText("Budget: 30%");

    // Hover to reveal tooltip
    await depletionElement.hover();
    const tooltip = page.locator(".mantine-Tooltip-tooltip");
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText("3/10 hours");
  });

  test("should coexist with 'Project allocation (%)' on separate lines", async ({
    page,
  }) => {
    const today = getTodayIso();
    const projectAlpha = "Alpha Coexist";
    const projectBeta = "Beta Coexist";

    // 3 hours on Alpha, 3 hours on Beta (total 6h)
    await addTask(page, projectAlpha, "08:00", "11:00", "Work Alpha");
    await addTask(page, projectBeta, "11:00", "14:00", "Work Beta");

    // Add 10h budget for Alpha
    await navigateToBudgets(page);
    await selectProjectOnBudgetsPage(page, projectAlpha);
    await addBudgetOnBudgetsPage(page, today, today, "Sprint Alpha", "10", 1);

    await navigateToTimeCollector(page);

    // Enable "Project allocation (%)"
    await page.getByTestId("checkbox-show-percentages").click();

    // Alpha time cell shows 50%, project cell shows Budget: 30%
    await expect(
      page.getByTestId(`summary-percentage-${projectAlpha}`),
    ).toHaveText("50%");
    await expect(
      page.getByTestId(`summary-budget-depletion-${projectAlpha}`),
    ).toHaveText("Budget: 30%");

    // Beta time cell shows 50%, project cell has NO budget depletion
    await expect(
      page.getByTestId(`summary-percentage-${projectBeta}`),
    ).toHaveText("50%");
    await expect(
      page.getByTestId(`summary-budget-depletion-${projectBeta}`),
    ).not.toBeVisible();
  });

  test("should hide budget depletion when 'List by task' is checked", async ({
    page,
  }) => {
    const today = getTodayIso();
    const projectName = "Task Mode Project";

    await addTask(page, projectName, "09:00", "12:00", "Refactoring");

    await navigateToBudgets(page);
    await selectProjectOnBudgetsPage(page, projectName);
    await addBudgetOnBudgetsPage(page, today, today, "Maintenance", "12", 1);

    await navigateToTimeCollector(page);

    const depletion = page.getByTestId(
      `summary-budget-depletion-${projectName}`,
    );
    await expect(depletion).toBeVisible();
    await expect(depletion).toHaveText("Budget: 25%");

    // Check "List by task" -> depletion should disappear
    await page.getByTestId("checkbox-list-by-task").click();
    await expect(depletion).not.toBeVisible();

    // Uncheck "List by task" -> depletion reappears
    await page.getByTestId("checkbox-list-by-task").click();
    await expect(depletion).toBeVisible();
    await expect(depletion).toHaveText("Budget: 25%");
  });

  test("should sum multiple overlapping budgets and ignore non-overlapping budgets", async ({
    page,
  }) => {
    const today = getTodayIso();
    const projectName = "Multi Budget Project";

    // 3 hours logged today
    await addTask(page, projectName, "08:00", "11:00", "Implementation");

    await navigateToBudgets(page);
    await selectProjectOnBudgetsPage(page, projectName);

    // Budget 1: Today, 10h (overlaps)
    await addBudgetOnBudgetsPage(page, today, today, "Current Scope", "10", 1);

    // Budget 2: Today, 5h (overlaps)
    await addBudgetOnBudgetsPage(page, today, today, "Scope Addition", "5", 2);

    // Budget 3: Past non-overlapping, 100h (2020-01-01 to 2020-01-31)
    await addBudgetOnBudgetsPage(
      page,
      "2020-01-01",
      "2020-01-31",
      "Historical Scope",
      "100",
      3,
    );

    await navigateToTimeCollector(page);

    // Overlapping sum = 10 + 5 = 15h. Spent = 3h. Depletion = 3 / 15 * 100 = 20%
    const depletion = page.getByTestId(
      `summary-budget-depletion-${projectName}`,
    );
    await expect(depletion).toBeVisible();
    await expect(depletion).toHaveText("Budget: 20%");

    // Hover tooltip: 3/15 hours
    await depletion.hover();
    const tooltip = page.locator(".mantine-Tooltip-tooltip");
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText("3/15 hours");
  });

  test("should format budget depletion with at most 1 decimal place (e.g. 1.5% and 17%)", async ({
    page,
  }) => {
    const today = getTodayIso();
    const projectName = "Decimal Project";

    // 01:30 = 1.5 hours on Decimal Project today
    await addTask(page, projectName, "08:00", "09:30", "Testing Decimals");

    await navigateToBudgets(page);
    await selectProjectOnBudgetsPage(page, projectName);
    await addBudgetOnBudgetsPage(page, today, today, "Large Budget", "100", 1);

    await navigateToTimeCollector(page);

    const depletion = page.getByTestId(
      `summary-budget-depletion-${projectName}`,
    );
    await expect(depletion).toBeVisible();
    await expect(depletion).toHaveText("Budget: 1.5%");

    await depletion.hover();
    const tooltip = page.locator(".mantine-Tooltip-tooltip");
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText("1.5/100 hours");
  });

  test("should calculate cumulative budget spent hours up to date range end (Issue #270)", async ({
    page,
  }) => {
    const today = getTodayIso();
    const projectName = "Cumulative Budget Project";

    // 1. Add 2h task today to create project
    await addTask(page, projectName, "08:00", "10:00", "Work part 1");

    // 2. Navigate to Budgets and add a 10h budget covering today
    await navigateToBudgets(page);
    await selectProjectOnBudgetsPage(page, projectName);
    await addBudgetOnBudgetsPage(
      page,
      today,
      today,
      "Cumulative Scope",
      "10",
      1,
    );

    // 3. Return to Time Collector
    await navigateToTimeCollector(page);

    // Depletion: 2h / 10h = 20%
    const depletion = page.getByTestId(
      `summary-budget-depletion-${projectName}`,
    );
    await expect(depletion).toBeVisible();
    await expect(depletion).toHaveText("Budget: 20%");

    // 4. Add another 3h task today
    await addTask(page, projectName, "10:00", "13:00", "Work part 2");

    // Depletion should now update to 5h / 10h = 50%
    await expect(depletion).toHaveText("Budget: 50%");
    await depletion.hover();
    const tooltip = page.locator(".mantine-Tooltip-tooltip");
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText("5/10 hours");
  });
});
