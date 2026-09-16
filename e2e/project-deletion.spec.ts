import { expect, Page, test } from "@playwright/test";
import { ensureAddButtonIsVisible } from "./utils";

async function addTask(
  page: Page,
  projectName: string,
  comment: string,
  startTime: string,
  endTime: string,
) {
  await ensureAddButtonIsVisible(page);

  await page.getByTestId("add-entry-input-start-time").fill(startTime);
  await page.getByTestId("add-entry-input-end-time").fill(endTime);
  await page.getByTestId("add-entry-input-project").fill(projectName);
  if (comment) {
    await page.getByTestId("add-entry-input-comment").fill(comment);
  }
  await page.getByTestId("button-add-task").click();
  await expect(page.getByTestId("button-add-task")).toBeVisible({
    timeout: 5000,
  });
}

async function navigateToProjects(page: Page) {
  await page.getByTestId("navigation-burger").click();
  const projectsNav = page.getByTestId("nav-projects");
  await expect(projectsNav).toBeVisible({ timeout: 5000 });
  await projectsNav.click();
  await expect(page.getByTestId("projects-page")).toBeVisible();
}

async function navigateToTasks(page: Page) {
  await page.getByTestId("navigation-burger").click();
  const tasksNav = page.getByTestId("nav-tasks");
  await expect(tasksNav).toBeVisible({ timeout: 5000 });
  await tasksNav.click();
  await expect(page.getByTestId("tasks-page")).toBeVisible();
}

async function getProjectRowByName(page: Page, projectName: string) {
  const rows = page.locator('[data-testid^="project-row-"]');
  const count = await rows.count();

  for (let index = 0; index < count; index++) {
    const row = rows.nth(index);
    const projectInput = row.locator('[data-testid^="project-name-input-"]');

    if ((await projectInput.inputValue()).trim() === projectName) {
      return row;
    }
  }

  throw new Error(`Could not find a project row for "${projectName}"`);
}

async function createEmptyProjectInDb(page: Page, projectName: string) {
  await page.evaluate(async (name) => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open("EffortumDatabase");
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction("projects", "readwrite");
        tx.objectStore("projects").add({ id: crypto.randomUUID(), name });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }, projectName);
}

test.describe("Project Deletion", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
  });

  test("should directly confirm and delete a project with zero tasks", async ({
    page,
  }) => {
    await createEmptyProjectInDb(page, "EmptyProject");
    await navigateToProjects(page);

    const emptyRow = await getProjectRowByName(page, "EmptyProject");
    const deleteButton = emptyRow.locator(
      '[data-testid^="button-delete-project-"]',
    );
    await deleteButton.click();

    await expect(page.getByTestId("modal-delete-project")).toBeVisible();
    await expect(page.getByTestId("text-delete-zero-tasks")).toContainText(
      'Are you sure you want to delete project "EmptyProject"? This project has no tasks.',
    );

    await page.getByTestId("button-confirm-delete-project").click();

    await expect(
      page.getByTestId("toast-project-delete-success"),
    ).toBeVisible();
    await expect(page.getByTestId("modal-delete-project")).not.toBeVisible();
    await expect(page.getByTestId("projects-empty-state")).toBeVisible();
  });

  test("should cancel deletion for a zero-task project without modifying data", async ({
    page,
  }) => {
    await createEmptyProjectInDb(page, "UnchangedProject");
    await navigateToProjects(page);

    const row = await getProjectRowByName(page, "UnchangedProject");
    await row.locator('[data-testid^="button-delete-project-"]').click();

    await expect(page.getByTestId("modal-delete-project")).toBeVisible();
    await page.getByTestId("button-cancel-delete-project").click();

    await expect(page.getByTestId("modal-delete-project")).not.toBeVisible();
    const input = page.locator('[data-testid^="project-name-input-"]').first();
    await expect(input).toHaveValue("UnchangedProject");
  });

  test("should delete project and all its tasks when user chooses delete tasks option", async ({
    page,
  }) => {
    await addTask(page, "ProjectToDelete", "Initial task", "09:00", "10:00");
    await navigateToProjects(page);

    const row = await getProjectRowByName(page, "ProjectToDelete");
    await row.locator('[data-testid^="button-delete-project-"]').click();

    await expect(page.getByTestId("modal-delete-project")).toBeVisible();
    await expect(page.getByTestId("text-delete-has-tasks")).toContainText(
      'Project "ProjectToDelete" has 1 task.',
    );
    await expect(page.getByTestId("alert-delete-all-tasks")).toBeVisible();

    await page.getByTestId("button-confirm-delete-project").click();

    await expect(
      page.getByTestId("toast-project-delete-success"),
    ).toBeVisible();
    await expect(page.getByTestId("modal-delete-project")).not.toBeVisible();
    await expect(page.getByTestId("projects-empty-state")).toBeVisible();

    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
    await expect(page.locator('[data-testid^="task-row-"]')).toHaveCount(0);
  });

  test("should cancel deletion of a project with tasks without deleting project or tasks", async ({
    page,
  }) => {
    await addTask(page, "ProjectToKeep", "Important task", "09:00", "10:00");
    await navigateToProjects(page);

    const row = await getProjectRowByName(page, "ProjectToKeep");
    await row.locator('[data-testid^="button-delete-project-"]').click();

    await expect(page.getByTestId("modal-delete-project")).toBeVisible();
    await page.getByTestId("button-cancel-delete-project").click();

    await expect(page.getByTestId("modal-delete-project")).not.toBeVisible();
    await expect(
      page.locator('[data-testid^="project-name-input-"]').first(),
    ).toHaveValue("ProjectToKeep");

    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
    await expect(page.locator('[data-testid^="task-row-"]')).toHaveCount(1);
  });

  test("should disable move option when there are no other projects available", async ({
    page,
  }) => {
    await addTask(page, "SoleProject", "Sole task", "09:00", "10:00");
    await navigateToProjects(page);

    const row = await getProjectRowByName(page, "SoleProject");
    await row.locator('[data-testid^="button-delete-project-"]').click();

    await expect(page.getByTestId("modal-delete-project")).toBeVisible();
    await expect(page.getByTestId("radio-move-tasks")).toBeDisabled();
    await expect(page.getByTestId("text-no-other-projects")).toBeVisible();

    await page.getByTestId("button-cancel-delete-project").click();
  });

  test("should move tasks to another project without conflicts and update booked hours", async ({
    page,
  }) => {
    await addTask(page, "SourceProj", "SourceComment", "09:00", "10:00"); // 1h
    await addTask(page, "TargetProj", "TargetComment", "11:00", "13:00"); // 2h

    await navigateToProjects(page);

    const sourceRow = await getProjectRowByName(page, "SourceProj");
    await sourceRow.locator('[data-testid^="button-delete-project-"]').click();

    await expect(page.getByTestId("modal-delete-project")).toBeVisible();
    await page.getByTestId("radio-move-tasks").click();

    const destSelect = page.getByTestId("select-destination-project");
    await destSelect.click();
    await page.getByRole("option", { name: "TargetProj" }).click();

    await expect(page.getByTestId("text-no-conflicts")).toBeVisible();
    await expect(page.getByTestId("text-no-conflicts")).toContainText(
      'All 1 task will be moved to "TargetProj".',
    );
    await expect(
      page.getByTestId("alert-conflicting-comments"),
    ).not.toBeVisible();

    await page.getByTestId("button-confirm-delete-project").click();

    await expect(
      page.getByTestId("toast-project-delete-success"),
    ).toBeVisible();
    await expect(page.getByTestId("modal-delete-project")).not.toBeVisible();

    // Source project is gone
    const inputs = page.locator('[data-testid^="project-name-input-"]');
    await expect(inputs).toHaveCount(1);
    await expect(inputs.first()).toHaveValue("TargetProj");

    // Target project hours updated: 2h + 1h = 3.00 h
    const targetRow = await getProjectRowByName(page, "TargetProj");
    await expect(
      targetRow.locator('[data-testid^="project-task-hours-sum-"]'),
    ).toHaveText("3.00 h");
  });

  test("should warn on conflicting comments when moving tasks, allow cancel without data change", async ({
    page,
  }) => {
    await addTask(page, "ProjectOne", "CommonTask", "09:00", "10:00");
    await addTask(page, "ProjectTwo", "CommonTask", "11:00", "12:00");

    await navigateToProjects(page);

    const rowOne = await getProjectRowByName(page, "ProjectOne");
    await rowOne.locator('[data-testid^="button-delete-project-"]').click();

    await expect(page.getByTestId("modal-delete-project")).toBeVisible();
    await page.getByTestId("radio-move-tasks").click();

    const destSelect = page.getByTestId("select-destination-project");
    await destSelect.click();
    await page.getByRole("option", { name: "ProjectTwo" }).click();

    // Verify conflict warning, comment list, guidance, and confirmation question
    await expect(page.getByTestId("alert-conflicting-comments")).toBeVisible();
    await expect(page.getByTestId("conflicting-comments-list")).toBeVisible();
    await expect(page.getByTestId("conflicting-comment-item")).toHaveText(
      "CommonTask",
    );
    await expect(page.getByTestId("rename-guidance-text")).toHaveText(
      "Guidance: You can rename the tasks in the tasks management page.",
    );
    await expect(
      page.getByText("Do you really want to move the tasks?"),
    ).toBeVisible();

    // Deny / Cancel
    await page.getByTestId("button-cancel-delete-project").click();
    await expect(page.getByTestId("modal-delete-project")).not.toBeVisible();

    // Verify both projects remain unchanged
    const inputs = page.locator('[data-testid^="project-name-input-"]');
    await expect(inputs).toHaveCount(2);
    await expect(inputs.nth(0)).toHaveValue("ProjectOne");
    await expect(inputs.nth(1)).toHaveValue("ProjectTwo");
  });

  test("should allow accepting task move despite conflicting comments and merge comments", async ({
    page,
  }) => {
    await addTask(page, "BetaProject", "SharedComment", "08:00", "09:00");
    await addTask(page, "GammaProject", "SharedComment", "10:00", "11:30");

    await navigateToProjects(page);

    const betaRow = await getProjectRowByName(page, "BetaProject");
    await betaRow.locator('[data-testid^="button-delete-project-"]').click();

    await expect(page.getByTestId("modal-delete-project")).toBeVisible();
    await page.getByTestId("radio-move-tasks").click();

    const destSelect = page.getByTestId("select-destination-project");
    await destSelect.click();
    await page.getByRole("option", { name: "GammaProject" }).click();

    await expect(page.getByTestId("alert-conflicting-comments")).toBeVisible();

    // Accept / Confirm move
    await page.getByTestId("button-confirm-delete-project").click();
    await expect(
      page.getByTestId("toast-project-delete-success"),
    ).toBeVisible();
    await expect(page.getByTestId("modal-delete-project")).not.toBeVisible();

    // BetaProject is gone, GammaProject remains
    const inputs = page.locator('[data-testid^="project-name-input-"]');
    await expect(inputs).toHaveCount(1);
    await expect(inputs.first()).toHaveValue("GammaProject");

    // Navigate to Tasks page and verify the comment now has 2 tasks under GammaProject
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();
    await navigateToTasks(page);
    const projectSelect = page.getByTestId("project-select");
    await projectSelect.click();
    await page.getByRole("option", { name: "GammaProject" }).click();

    await expect(page.getByTestId("task-comment-row-0")).toBeVisible();
    await expect(page.getByTestId("task-comment-count-0")).toContainText(
      "2 tasks",
    );
  });

  test("should reset conflict checking state when clearing destination or switching away from move", async ({
    page,
  }) => {
    await addTask(page, "AlphaProject", "TaskAlpha", "09:00", "10:00");
    await addTask(page, "BetaProject", "TaskBeta", "10:00", "11:00");

    await navigateToProjects(page);

    const alphaRow = await getProjectRowByName(page, "AlphaProject");
    await alphaRow.locator('[data-testid^="button-delete-project-"]').click();

    await expect(page.getByTestId("modal-delete-project")).toBeVisible();
    await page.getByTestId("radio-move-tasks").click();

    const destSelect = page.getByTestId("select-destination-project");
    await destSelect.click();
    await page.getByRole("option", { name: "BetaProject" }).click();

    // Verify conflicts checked
    await expect(page.getByTestId("text-no-conflicts")).toBeVisible();
    await expect(page.getByText("Checking task comments...")).not.toBeVisible();

    // Clear destination
    await page.getByLabel("Clear destination project").click();
    await expect(page.getByText("Checking task comments...")).not.toBeVisible();
    await expect(page.getByTestId("text-no-conflicts")).not.toBeVisible();

    // Re-select destination
    await destSelect.click();
    await page.getByRole("option", { name: "BetaProject" }).click();
    await expect(page.getByTestId("text-no-conflicts")).toBeVisible();

    // Switch to delete tasks action
    await page.getByTestId("radio-delete-tasks").click();
    await expect(page.getByText("Checking task comments...")).not.toBeVisible();
    await expect(page.getByTestId("alert-delete-all-tasks")).toBeVisible();

    // Switch back to move tasks action
    await page.getByTestId("radio-move-tasks").click();
    await expect(page.getByText("Checking task comments...")).not.toBeVisible();

    // Cancel modal
    await page.getByTestId("button-cancel-delete-project").click();
    await expect(page.getByTestId("modal-delete-project")).not.toBeVisible();
  });
});
