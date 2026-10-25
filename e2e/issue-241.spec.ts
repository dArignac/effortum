import { expect, test } from "@playwright/test";
import { addTask } from "./utils";

test.describe("Issue #241: Make percentage value optional", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
  });

  test("should render 'Show percentages' checkbox unchecked beneath 'List by task'", async ({
    page,
  }) => {
    const listByTaskCheckbox = page.getByTestId("checkbox-list-by-task");
    const showPercentagesCheckbox = page.getByTestId(
      "checkbox-show-percentages",
    );

    await expect(listByTaskCheckbox).toBeVisible();
    await expect(showPercentagesCheckbox).toBeVisible();
    await expect(showPercentagesCheckbox).not.toBeChecked();

    const label = page.locator("label", { hasText: "Show percentages" });
    await expect(label).toBeVisible();
  });

  test("should not display percentage values by default when tasks are present", async ({
    page,
  }) => {
    await addTask(page, "Project Alpha", "09:00", "10:00", "Work Alpha");
    await addTask(page, "Project Beta", "10:00", "12:00", "Work Beta");

    // Verify summary sum is rendered
    await expect(page.getByTestId("summary-sum-value")).toHaveText("03:00");

    // Verify percentages are not visible by default
    await expect(
      page.getByTestId("summary-percentage-Project Alpha"),
    ).not.toBeVisible();
    await expect(
      page.getByTestId("summary-percentage-Project Beta"),
    ).not.toBeVisible();
  });

  test("should toggle percentage visibility on and off when checkbox is clicked", async ({
    page,
  }) => {
    await addTask(page, "Project Alpha", "09:00", "10:00", "Work Alpha");
    await addTask(page, "Project Beta", "10:00", "12:00", "Work Beta");

    const checkbox = page.getByTestId("checkbox-show-percentages");

    // Initially unchecked and hidden
    await expect(checkbox).not.toBeChecked();
    await expect(
      page.getByTestId("summary-percentage-Project Alpha"),
    ).not.toBeVisible();

    // Check: reveals percentages
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await expect(
      page.getByTestId("summary-percentage-Project Alpha"),
    ).toBeVisible();
    await expect(
      page.getByTestId("summary-percentage-Project Alpha"),
    ).toHaveText("33 %");
    await expect(
      page.getByTestId("summary-percentage-Project Beta"),
    ).toHaveText("67 %");

    // Uncheck: hides percentages
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
    await expect(
      page.getByTestId("summary-percentage-Project Alpha"),
    ).not.toBeVisible();
    await expect(
      page.getByTestId("summary-percentage-Project Beta"),
    ).not.toBeVisible();
  });

  test("should toggle percentages correctly in list-by-task mode", async ({
    page,
  }) => {
    await addTask(page, "Project Gamma", "08:00", "09:00", "Task One");
    await addTask(page, "Project Gamma", "09:00", "11:00", "Task Two");

    // Switch to list by task
    await page.getByTestId("checkbox-list-by-task").click();

    // Percentages hidden initially
    await expect(
      page.getByTestId("summary-percentage-Task One"),
    ).not.toBeVisible();
    await expect(
      page.getByTestId("summary-percentage-Task Two"),
    ).not.toBeVisible();

    // Enable percentages
    await page.getByTestId("checkbox-show-percentages").click();
    await expect(page.getByTestId("summary-percentage-Task One")).toBeVisible();
    await expect(page.getByTestId("summary-percentage-Task One")).toHaveText(
      "33 %",
    );
    await expect(page.getByTestId("summary-percentage-Task Two")).toHaveText(
      "67 %",
    );

    // Disable percentages
    await page.getByTestId("checkbox-show-percentages").click();
    await expect(
      page.getByTestId("summary-percentage-Task One"),
    ).not.toBeVisible();
    await expect(
      page.getByTestId("summary-percentage-Task Two"),
    ).not.toBeVisible();
  });
});
