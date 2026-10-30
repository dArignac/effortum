import { expect, Page, test } from "@playwright/test";
import { addTask, ensureAddButtonIsVisible } from "./utils";

async function addTaskOnYesterday(
  page: Page,
  projectName: string,
  startTime: string,
  endTime: string,
  comment?: string,
) {
  await ensureAddButtonIsVisible(page);

  await page.getByTestId("add-entry-input-date").click();
  const yesterdayPreset = page.getByRole("button", { name: "Yesterday" });
  await expect(yesterdayPreset).toBeVisible();
  await yesterdayPreset.click();

  await page.getByTestId("add-entry-input-start-time").fill(startTime);
  await page.getByTestId("add-entry-input-end-time").fill(endTime);
  await page.getByTestId("add-entry-input-project").fill(projectName);
  const commentInput = page.getByTestId("add-entry-input-comment");
  await commentInput.fill(comment ?? "");

  await page.getByTestId("button-add-task").click();
  await expect(page.getByTestId("button-add-task")).toBeVisible({
    timeout: 5000,
  });
}

test.describe("Issue #128: Sort tasks by usage (last used)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
  });

  test("orders project autocomplete by most recently used and updates when an older project is reused", async ({
    page,
  }) => {
    await addTask(page, "AlphaProject", "08:00", "09:00", "Setup");
    await addTask(page, "GammaProject", "09:00", "10:00", "Build");
    await addTask(page, "BetaProject", "10:00", "11:00", "Verify");

    const projectInput = page.getByTestId("add-entry-input-project");
    await projectInput.clear();
    await projectInput.click();

    await expect(page.getByRole("option")).toHaveText([
      "BetaProject",
      "GammaProject",
      "AlphaProject",
    ]);

    await page.keyboard.press("Escape");

    // Reuse AlphaProject at a later time so it moves to the top
    await addTask(page, "AlphaProject", "11:00", "12:00", "Follow-up");

    await projectInput.clear();
    await projectInput.click();

    await expect(page.getByRole("option")).toHaveText([
      "AlphaProject",
      "BetaProject",
      "GammaProject",
    ]);
  });

  test("orders comment autocomplete for the selected project by most recently used and updates on reuse", async ({
    page,
  }) => {
    await addTask(page, "ClientPortal", "08:00", "09:00", "Alpha comment");
    await addTask(page, "ClientPortal", "09:00", "10:00", "Zeta comment");
    await addTask(page, "ClientPortal", "10:00", "11:00", "Middle comment");

    const projectInput = page.getByTestId("add-entry-input-project");
    await projectInput.fill("ClientPortal");

    const commentInput = page.getByTestId("add-entry-input-comment");
    await commentInput.clear();
    await commentInput.click();

    await expect(page.getByRole("option")).toHaveText([
      "Middle comment",
      "Zeta comment",
      "Alpha comment",
    ]);

    await page.keyboard.press("Escape");

    // Reuse the oldest comment so it becomes the most recently used
    await addTask(page, "ClientPortal", "11:00", "12:00", "Alpha comment");

    await projectInput.fill("ClientPortal");
    await commentInput.clear();
    await commentInput.click();

    await expect(page.getByRole("option")).toHaveText([
      "Alpha comment",
      "Middle comment",
      "Zeta comment",
    ]);
  });

  test("preserves cross-date last-used ordering when viewing an empty day after reload", async ({
    page,
  }) => {
    await addTaskOnYesterday(
      page,
      "AlphaHistory",
      "08:00",
      "09:00",
      "Alpha older comment",
    );
    await addTaskOnYesterday(
      page,
      "GammaHistory",
      "09:00",
      "10:00",
      "Gamma comment",
    );
    await addTaskOnYesterday(
      page,
      "AlphaHistory",
      "10:00",
      "11:00",
      "Zeta newer comment",
    );
    await addTaskOnYesterday(
      page,
      "BetaHistory",
      "11:00",
      "12:00",
      "Beta comment",
    );

    // Reload so the app opens on Today with zero tasks loaded in the active date range
    await page.reload();
    await expect(page.getByTestId("task-list-table")).toBeVisible();
    await expect(page.locator('[data-testid^="task-row-"]')).toHaveCount(0);

    const projectInput = page.getByTestId("add-entry-input-project");
    await projectInput.click();

    await expect(page.getByRole("option")).toHaveText([
      "BetaHistory",
      "AlphaHistory",
      "GammaHistory",
    ]);

    await page.getByRole("option", { name: "AlphaHistory" }).click();

    const commentInput = page.getByTestId("add-entry-input-comment");
    await commentInput.click();

    await expect(page.getByRole("option")).toHaveText([
      "Zeta newer comment",
      "Alpha older comment",
    ]);
  });

  test("filters projects and comments by substring while preserving last-used order", async ({
    page,
  }) => {
    await addTask(page, "App Alpha", "08:00", "09:00", "Review alpha PR");
    await addTask(page, "Other Service", "09:00", "09:30", "Deploy");
    await addTask(page, "App Zeta", "09:30", "10:00", "Review alpha component");
    await addTask(page, "App Zeta", "10:00", "10:30", "Deploy release");
    await addTask(page, "App Zeta", "10:30", "11:00", "Review zeta component");
    await addTask(page, "App Middle", "11:00", "11:30", "Planning");

    const projectInput = page.getByTestId("add-entry-input-project");
    await projectInput.clear();
    await projectInput.fill("app");

    await expect(page.getByRole("option")).toHaveText([
      "App Middle",
      "App Zeta",
      "App Alpha",
    ]);

    await page.getByRole("option", { name: "App Zeta" }).click();

    const commentInput = page.getByTestId("add-entry-input-comment");
    await commentInput.clear();
    await commentInput.fill("review");

    await expect(page.getByRole("option")).toHaveText([
      "Review zeta component",
      "Review alpha component",
    ]);
  });

  test("orders project and comment dropdowns by last used when editing existing task rows", async ({
    page,
  }) => {
    await addTask(page, "AlphaRowProj", "08:00", "09:00", "Alpha old task");
    await addTask(page, "GammaRowProj", "09:00", "10:00", "Gamma task");
    await addTask(page, "AlphaRowProj", "10:00", "11:00", "Zeta recent task");
    await addTask(page, "BetaRowProj", "11:00", "12:00", "Beta latest task");

    const rows = page.locator('[data-testid^="task-row-"]');
    await expect(rows).toHaveCount(4);

    const firstRow = rows.nth(0);
    const firstRowProjectInput = firstRow.locator("td").nth(3).locator("input");
    await firstRowProjectInput.clear();
    await firstRowProjectInput.click();

    await expect(page.getByRole("option")).toHaveText([
      "BetaRowProj",
      "AlphaRowProj",
      "GammaRowProj",
    ]);

    await page.getByRole("option", { name: "AlphaRowProj" }).click();

    const firstRowCommentInput = firstRow.locator("td").nth(4).locator("input");
    await firstRowCommentInput.clear();
    await firstRowCommentInput.click();

    await expect(page.getByRole("option")).toHaveText([
      "Zeta recent task",
      "Alpha old task",
    ]);
  });
});
