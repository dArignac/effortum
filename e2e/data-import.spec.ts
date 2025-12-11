import { test, expect } from "@playwright/test";

test.describe("Data Import Functionality", () => {
  test("should display modal when file is selected", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    const validDexieExport = JSON.stringify({
      formatName: "dexie",
      formatVersion: 1,
      data: {
        databaseName: "EffortumDatabase",
        databaseVersion: 2,
        tables: [
          {
            name: "tasks",
            schema: "++id,date,timeStart,timeEnd,project,comment",
            rowCount: 0,
          },
          { name: "projects", schema: "++id,name", rowCount: 0 },
          { name: "comments", schema: "++id,project,comment", rowCount: 0 },
        ],
      },
    });

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("button-import-data").click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "test-backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(validDexieExport),
    });

    await expect(
      page.getByText(
        "Warning: This will completely replace your current database",
      ),
    ).toBeVisible();
    await expect(page.getByTestId("button-import-cancel")).toBeVisible();
    await expect(page.getByTestId("button-import-confirm")).toBeVisible();
  });

  test("should close modal when cancel button is clicked", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    const validDexieExport = JSON.stringify({
      formatName: "dexie",
      formatVersion: 1,
      data: {
        databaseName: "EffortumDatabase",
        databaseVersion: 2,
        tables: [
          {
            name: "tasks",
            schema: "++id,date,timeStart,timeEnd,project,comment",
            rowCount: 0,
          },
          { name: "projects", schema: "++id,name", rowCount: 0 },
          { name: "comments", schema: "++id,project,comment", rowCount: 0 },
        ],
      },
    });

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("button-import-data").click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "test-backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(validDexieExport),
    });

    await expect(
      page.getByText(
        "Warning: This will completely replace your current database",
      ),
    ).toBeVisible();

    await page.getByTestId("button-import-cancel").click();

    await expect(
      page.getByText(
        "Warning: This will completely replace your current database",
      ),
    ).not.toBeVisible();
  });

  test("should import data and reload page after confirmation", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // First, add a test task and export to get real Dexie format
    const addButton = page.getByTestId("button-add-task");
    const isAddButtonVisible = await addButton.isVisible();
    if (!isAddButtonVisible) {
      const emptyEndTimeInput = page.getByTestId("add-entry-input-end-time");
      if (await emptyEndTimeInput.isVisible()) {
        await emptyEndTimeInput.fill("17:00");
        await emptyEndTimeInput.blur();
        await expect(addButton).toBeVisible({ timeout: 5000 });
      }
    }

    // Add test data
    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").fill("10:30");
    await page
      .getByTestId("add-entry-input-project")
      .fill("Imported Project 1");
    await page
      .getByTestId("add-entry-input-comment")
      .fill("First imported task");
    await page.getByTestId("button-add-task").click();
    await expect(addButton).toBeVisible({ timeout: 5000 });

    await page.getByTestId("add-entry-input-start-time").fill("11:00");
    await page.getByTestId("add-entry-input-end-time").fill("12:00");
    await page
      .getByTestId("add-entry-input-project")
      .fill("Imported Project 2");
    await page
      .getByTestId("add-entry-input-comment")
      .fill("Second imported task");
    await page.getByTestId("button-add-task").click();
    await expect(addButton).toBeVisible({ timeout: 5000 });

    // Export the data to get valid format
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("button-export-data").click();
    const download = await downloadPromise;
    const path = await download.path();
    const fs = await import("fs");
    const exportContent = fs.readFileSync(path!, "utf-8");

    // Now import it back
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("button-import-data").click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "test-backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(exportContent),
    });

    await expect(
      page.getByText(
        "Warning: This will completely replace your current database",
      ),
    ).toBeVisible();

    // Click confirm
    await page.getByTestId("button-import-confirm").click();

    // Wait for success notification - this confirms import worked
    await expect(
      page.getByText("Database imported successfully! Reloading page..."),
    ).toBeVisible({ timeout: 10000 });

    // Wait for page reload - this confirms the page reloaded
    await page.waitForLoadState("load", { timeout: 5000 });

    // Confirm page reloaded successfully by checking table is back
    await expect(page.getByTestId("task-list-table")).toBeVisible();
    await expect(page.getByTestId("button-add-task")).toBeVisible();

    // Verify the imported data matches by parsing the export content
    const importedData = JSON.parse(exportContent);
    const tasksTable = importedData.data.tables.find(
      (t: any) => t.name === "tasks",
    );

    // Verify we imported exactly 2 tasks
    expect(tasksTable.rowCount).toBe(2);

    // Verify the imported data is actually displayed in the UI
    // Wait a bit for the store to reload from IndexedDB
    await page.waitForTimeout(500);

    const tableBody = page.locator("tbody");

    // Check for time values in input fields (use first() to avoid strict mode)
    await expect(
      tableBody.locator('input[type="time"][value="09:00"]').first(),
    ).toBeVisible();
    await expect(
      tableBody.locator('input[type="time"][value="10:30"]').first(),
    ).toBeVisible();
    await expect(
      tableBody.locator('input[type="time"][value="11:00"]').first(),
    ).toBeVisible();
    await expect(
      tableBody.locator('input[type="time"][value="12:00"]').first(),
    ).toBeVisible();

    // Check for project and comment content in autocomplete inputs
    await expect(
      tableBody.locator('input[value="Imported Project 1"]').first(),
    ).toBeVisible();
    await expect(
      tableBody.locator('input[value="First imported task"]').first(),
    ).toBeVisible();
    await expect(
      tableBody.locator('input[value="Imported Project 2"]').first(),
    ).toBeVisible();
    await expect(
      tableBody.locator('input[value="Second imported task"]').first(),
    ).toBeVisible();
  });

  test("should show error for invalid JSON file", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    const invalidJSON = "{ this is not valid JSON }";

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("button-import-data").click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from(invalidJSON),
    });

    await expect(
      page.getByText(
        "Warning: This will completely replace your current database",
      ),
    ).toBeVisible();

    await page.getByTestId("button-import-confirm").click();

    // Wait for error notification
    await expect(page.getByText(/Import failed/)).toBeVisible({
      timeout: 10000,
    });

    // Modal should still be open with error
    await expect(
      page.getByText(
        "Warning: This will completely replace your current database",
      ),
    ).toBeVisible();
  });

  test("should show error for non-Dexie format file", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    const nonDexieJSON = JSON.stringify({
      formatName: "other",
      data: { some: "data" },
    });

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("button-import-data").click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "wrong-format.json",
      mimeType: "application/json",
      buffer: Buffer.from(nonDexieJSON),
    });

    await expect(
      page.getByText(
        "Warning: This will completely replace your current database",
      ),
    ).toBeVisible();

    await page.getByTestId("button-import-confirm").click();

    // Wait for error notification with specific message
    await expect(
      page.getByText(/Import failed.*Invalid backup file format/),
    ).toBeVisible({ timeout: 10000 });

    // Modal should still be open
    await expect(
      page.getByText(
        "Warning: This will completely replace your current database",
      ),
    ).toBeVisible();
  });
});
