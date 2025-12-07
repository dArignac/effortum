import { expect, test } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("Data Import Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load
    await expect(page.getByTestId("task-list-table")).toBeVisible();

    // Complete any incomplete tasks to ensure Add button is visible
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
  });

  test("should display import data button", async ({ page }) => {
    const importButton = page.getByTestId("button-import-data");
    await expect(importButton).toBeVisible();
    await expect(importButton).toHaveText("Import Data");
  });

  test("should open confirmation modal when file is selected", async ({
    page,
  }) => {
    // Create a valid Dexie export file
    const testData = {
      formatName: "dexie",
      formatVersion: 1,
      data: {
        databaseName: "EffortumDatabase",
        databaseVersion: 2,
        tables: [
          {
            name: "tasks",
            schema: "++id,date,timeStart,timeEnd,project,comment",
            rowCount: 1,
            rows: [
              [
                1,
                {
                  id: 1,
                  date: "2025-12-07",
                  timeStart: "09:00",
                  timeEnd: "10:00",
                  project: "Test Project",
                  comment: "Test Comment",
                },
              ],
            ],
          },
          {
            name: "projects",
            schema: "++id,name",
            rowCount: 1,
            rows: [[1, { id: 1, name: "Test Project" }]],
          },
          {
            name: "comments",
            schema: "++id,project,comment",
            rowCount: 0,
            rows: [],
          },
        ],
      },
    };

    // Set up file chooser listener before clicking the button
    const fileChooserPromise = page.waitForEvent("filechooser");

    // Click import button
    const importButton = page.getByTestId("button-import-data");
    await importButton.click();

    // Wait for file chooser
    const fileChooser = await fileChooserPromise;

    // Create temporary file
    const tempFile = path.join(__dirname, "temp-import-test.json");
    fs.writeFileSync(tempFile, JSON.stringify(testData, null, 2));

    try {
      // Select the file
      await fileChooser.setFiles(tempFile);

      // Verify modal is opened
      const modal = page.getByTestId("modal-import-confirm");
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Verify warning text
      await expect(
        page.locator(
          'text="Warning: This will completely replace your current database"',
        ),
      ).toBeVisible();
      await expect(
        page.locator('text="This action cannot be undone!"'),
      ).toBeVisible();

      // Verify buttons are present
      await expect(page.getByTestId("button-import-cancel")).toBeVisible();
      await expect(page.getByTestId("button-import-confirm")).toBeVisible();
    } finally {
      // Cleanup
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  test("should cancel import when cancel button is clicked", async ({
    page,
  }) => {
    const testData = {
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
            rows: [],
          },
          {
            name: "projects",
            schema: "++id,name",
            rowCount: 0,
            rows: [],
          },
          {
            name: "comments",
            schema: "++id,project,comment",
            rowCount: 0,
            rows: [],
          },
        ],
      },
    };

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("button-import-data").click();
    const fileChooser = await fileChooserPromise;

    const tempFile = path.join(__dirname, "temp-import-cancel-test.json");
    fs.writeFileSync(tempFile, JSON.stringify(testData, null, 2));

    try {
      await fileChooser.setFiles(tempFile);

      // Wait for modal
      const modal = page.getByTestId("modal-import-confirm");
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Click cancel
      await page.getByTestId("button-import-cancel").click();

      // Verify modal is closed
      await expect(modal).not.toBeVisible({ timeout: 5000 });
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  test("should import valid database file and reload page", async ({
    page,
  }) => {
    // First, add some data that will be replaced
    await page.getByTestId("add-entry-input-start-time").fill("08:00");
    await page.getByTestId("add-entry-input-end-time").fill("09:00");
    await page.getByTestId("add-entry-input-project").fill("Old Project");
    await page.getByTestId("add-entry-input-comment").fill("Old Comment");
    await page.getByTestId("button-add-task").click();

    // Wait for task to be added
    await expect(page.getByTestId("button-add-task")).toBeVisible({
      timeout: 5000,
    });

    // Create import data with different content
    const testData = {
      formatName: "dexie",
      formatVersion: 1,
      data: {
        databaseName: "EffortumDatabase",
        databaseVersion: 2,
        tables: [
          {
            name: "tasks",
            schema: "++id,date,timeStart,timeEnd,project,comment",
            rowCount: 2,
            rows: [
              [
                1,
                {
                  id: 1,
                  date: "2025-12-07",
                  timeStart: "10:00",
                  timeEnd: "11:00",
                  project: "Imported Project A",
                  comment: "Imported Task 1",
                },
              ],
              [
                2,
                {
                  id: 2,
                  date: "2025-12-07",
                  timeStart: "11:00",
                  timeEnd: "12:00",
                  project: "Imported Project B",
                  comment: "Imported Task 2",
                },
              ],
            ],
          },
          {
            name: "projects",
            schema: "++id,name",
            rowCount: 2,
            rows: [
              [1, { id: 1, name: "Imported Project A" }],
              [2, { id: 2, name: "Imported Project B" }],
            ],
          },
          {
            name: "comments",
            schema: "++id,project,comment",
            rowCount: 0,
            rows: [],
          },
        ],
      },
    };

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("button-import-data").click();
    const fileChooser = await fileChooserPromise;

    const tempFile = path.join(__dirname, "temp-import-valid-test.json");
    fs.writeFileSync(tempFile, JSON.stringify(testData, null, 2));

    try {
      await fileChooser.setFiles(tempFile);

      // Wait for modal
      await expect(page.getByTestId("modal-import-confirm")).toBeVisible({
        timeout: 5000,
      });

      // Confirm import
      await page.getByTestId("button-import-confirm").click();

      // Wait for success notification
      await expect(
        page.locator('text="Database imported successfully!"'),
      ).toBeVisible({ timeout: 10000 });

      // Wait for page reload (the page will reload after 1 second)
      await page.waitForLoadState("load", { timeout: 10000 });

      // Wait for the page to be fully loaded again
      await expect(page.getByTestId("task-list-table")).toBeVisible({
        timeout: 10000,
      });

      // Verify the old data is gone and new data is present
      await expect(page.locator('text="Old Project"')).not.toBeVisible();
      await expect(page.locator('text="Imported Project A"')).toBeVisible();
      await expect(page.locator('text="Imported Project B"')).toBeVisible();
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  test("should show progress bar during import", async ({ page }) => {
    const testData = {
      formatName: "dexie",
      formatVersion: 1,
      data: {
        databaseName: "EffortumDatabase",
        databaseVersion: 2,
        tables: [
          {
            name: "tasks",
            schema: "++id,date,timeStart,timeEnd,project,comment",
            rowCount: 1,
            rows: [
              [
                1,
                {
                  id: 1,
                  date: "2025-12-07",
                  timeStart: "14:00",
                  timeEnd: "15:00",
                  project: "Progress Test Project",
                  comment: "Progress Test",
                },
              ],
            ],
          },
          {
            name: "projects",
            schema: "++id,name",
            rowCount: 1,
            rows: [[1, { id: 1, name: "Progress Test Project" }]],
          },
          {
            name: "comments",
            schema: "++id,project,comment",
            rowCount: 0,
            rows: [],
          },
        ],
      },
    };

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("button-import-data").click();
    const fileChooser = await fileChooserPromise;

    const tempFile = path.join(__dirname, "temp-import-progress-test.json");
    fs.writeFileSync(tempFile, JSON.stringify(testData, null, 2));

    try {
      await fileChooser.setFiles(tempFile);

      await expect(page.getByTestId("modal-import-confirm")).toBeVisible({
        timeout: 5000,
      });

      await page.getByTestId("button-import-confirm").click();

      // Verify progress bar appears
      await expect(page.getByTestId("import-progress")).toBeVisible({
        timeout: 5000,
      });

      // Wait for completion
      await expect(
        page.locator('text="Database imported successfully!"'),
      ).toBeVisible({ timeout: 10000 });
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  test("should show error for invalid JSON file", async ({ page }) => {
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("button-import-data").click();
    const fileChooser = await fileChooserPromise;

    const tempFile = path.join(__dirname, "temp-import-invalid-json.json");
    fs.writeFileSync(tempFile, "{ invalid json content");

    try {
      await fileChooser.setFiles(tempFile);

      await expect(page.getByTestId("modal-import-confirm")).toBeVisible({
        timeout: 5000,
      });

      await page.getByTestId("button-import-confirm").click();

      // Wait for error notification
      await expect(page.locator('text="Import failed:"')).toBeVisible({
        timeout: 10000,
      });
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  test("should show error for non-Dexie format file", async ({ page }) => {
    const testData = {
      formatName: "some-other-format",
      data: {
        tasks: [],
      },
    };

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("button-import-data").click();
    const fileChooser = await fileChooserPromise;

    const tempFile = path.join(__dirname, "temp-import-wrong-format.json");
    fs.writeFileSync(tempFile, JSON.stringify(testData, null, 2));

    try {
      await fileChooser.setFiles(tempFile);

      await expect(page.getByTestId("modal-import-confirm")).toBeVisible({
        timeout: 5000,
      });

      await page.getByTestId("button-import-confirm").click();

      // Wait for error notification with specific message
      await expect(
        page.locator('text="Invalid backup file format"'),
      ).toBeVisible({ timeout: 10000 });
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  test("should disable import button during import process", async ({
    page,
  }) => {
    const testData = {
      formatName: "dexie",
      formatVersion: 1,
      data: {
        databaseName: "EffortumDatabase",
        databaseVersion: 2,
        tables: [
          {
            name: "tasks",
            schema: "++id,date,timeStart,timeEnd,project,comment",
            rowCount: 1,
            rows: [
              [
                1,
                {
                  id: 1,
                  date: "2025-12-07",
                  timeStart: "16:00",
                  timeEnd: "17:00",
                  project: "Disable Test Project",
                  comment: "Disable Test",
                },
              ],
            ],
          },
          {
            name: "projects",
            schema: "++id,name",
            rowCount: 1,
            rows: [[1, { id: 1, name: "Disable Test Project" }]],
          },
          {
            name: "comments",
            schema: "++id,project,comment",
            rowCount: 0,
            rows: [],
          },
        ],
      },
    };

    const fileChooserPromise = page.waitForEvent("filechooser");
    const importButton = page.getByTestId("button-import-data");

    // Verify button is initially enabled
    await expect(importButton).toBeEnabled();

    await importButton.click();
    const fileChooser = await fileChooserPromise;

    const tempFile = path.join(__dirname, "temp-import-disable-test.json");
    fs.writeFileSync(tempFile, JSON.stringify(testData, null, 2));

    try {
      await fileChooser.setFiles(tempFile);

      await expect(page.getByTestId("modal-import-confirm")).toBeVisible({
        timeout: 5000,
      });

      await page.getByTestId("button-import-confirm").click();

      // During import, the button should be disabled
      await expect(importButton).toBeDisabled({ timeout: 5000 });

      // Wait for completion
      await expect(
        page.locator('text="Database imported successfully!"'),
      ).toBeVisible({ timeout: 10000 });
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  test("should prevent closing modal during import", async ({ page }) => {
    const testData = {
      formatName: "dexie",
      formatVersion: 1,
      data: {
        databaseName: "EffortumDatabase",
        databaseVersion: 2,
        tables: [
          {
            name: "tasks",
            schema: "++id,date,timeStart,timeEnd,project,comment",
            rowCount: 1,
            rows: [
              [
                1,
                {
                  id: 1,
                  date: "2025-12-07",
                  timeStart: "18:00",
                  timeEnd: "19:00",
                  project: "Modal Test Project",
                  comment: "Modal Test",
                },
              ],
            ],
          },
          {
            name: "projects",
            schema: "++id,name",
            rowCount: 1,
            rows: [[1, { id: 1, name: "Modal Test Project" }]],
          },
          {
            name: "comments",
            schema: "++id,project,comment",
            rowCount: 0,
            rows: [],
          },
        ],
      },
    };

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("button-import-data").click();
    const fileChooser = await fileChooserPromise;

    const tempFile = path.join(__dirname, "temp-import-modal-test.json");
    fs.writeFileSync(tempFile, JSON.stringify(testData, null, 2));

    try {
      await fileChooser.setFiles(tempFile);

      const modal = page.getByTestId("modal-import-confirm");
      await expect(modal).toBeVisible({ timeout: 5000 });

      await page.getByTestId("button-import-confirm").click();

      // Verify progress bar appears (meaning import started)
      await expect(page.getByTestId("import-progress")).toBeVisible({
        timeout: 5000,
      });

      // Cancel button should not be visible during import
      await expect(page.getByTestId("button-import-cancel")).not.toBeVisible();

      // Wait for completion
      await expect(
        page.locator('text="Database imported successfully!"'),
      ).toBeVisible({ timeout: 10000 });
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });
});
