import { expect, test } from "@playwright/test";
import fs from "fs";

test.describe("Data Export Functionality", () => {
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

  test("should display export data button", async ({ page }) => {
    // Open the navigation by clicking the burger menu
    const burgerMenu = page.getByTestId("navigation-burger");
    await burgerMenu.click();
    await page.waitForTimeout(200);

    // Navigate to Import/Export section
    const importExportNav = page.getByTestId("nav-import-export");
    await importExportNav.click();
    await page.waitForTimeout(200);

    const exportButton = page.getByTestId("button-export-data");
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toHaveText("Export Data");
  });

  test("should trigger download when export button is clicked", async ({
    page,
  }) => {
    // Open the navigation by clicking the burger menu
    const burgerMenu = page.getByTestId("navigation-burger");
    await burgerMenu.click();
    await page.waitForTimeout(200);

    // Navigate to Import/Export section
    const importExportNav = page.getByTestId("nav-import-export");
    await importExportNav.click();
    await page.waitForTimeout(200);

    // Set up download listener
    const downloadPromise = page.waitForEvent("download");

    // Click the export button
    const exportButton = page.getByTestId("button-export-data");
    await exportButton.click();

    // Wait for the download to start
    const download = await downloadPromise;

    // Verify the download filename contains expected pattern
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^database-backup-\d{4}-\d{2}-\d{2}T.*\.json$/);

    // Verify the file has content (not empty)
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    if (downloadPath) {
      const stats = fs.statSync(downloadPath);
      expect(stats.size).toBeGreaterThan(0);
    }
  });

  test("should export valid JSON database backup", async ({ page }) => {
    // Add some test data first
    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").fill("10:00");
    await page.getByTestId("add-entry-input-project").fill("Test Project");
    await page.getByTestId("add-entry-input-comment").fill("Test Comment");
    await page.getByTestId("button-add-task").click();

    // Wait for task to be added
    await expect(page.getByTestId("button-add-task")).toBeVisible({
      timeout: 5000,
    });

    // Open the navigation by clicking the burger menu
    const burgerMenu = page.getByTestId("navigation-burger");
    await burgerMenu.click();
    await page.waitForTimeout(200);

    // Navigate to Import/Export section
    const importExportNav = page.getByTestId("nav-import-export");
    await importExportNav.click();
    await page.waitForTimeout(200);

    // Set up download listener
    const downloadPromise = page.waitForEvent("download");

    // Click export button
    const exportButton = page.getByTestId("button-export-data");
    await exportButton.click();

    const download = await downloadPromise;
    const downloadPath = await download.path();

    expect(downloadPath).toBeTruthy();

    if (downloadPath) {
      // Read and parse the JSON file
      const fileContent = fs.readFileSync(downloadPath, "utf-8");
      const exportedData = JSON.parse(fileContent);

      // Verify basic Dexie export structure
      expect(exportedData).toHaveProperty("formatName");
      expect(exportedData.formatName).toBe("dexie");
      expect(exportedData).toHaveProperty("data");
      expect(exportedData.data).toHaveProperty("databaseName");
      expect(exportedData.data.databaseName).toBe("EffortumDatabase");
      expect(exportedData.data).toHaveProperty("tables");

      // Verify tables exist
      const tables = exportedData.data.tables;
      expect(Array.isArray(tables)).toBe(true);
      expect(tables.length).toBeGreaterThan(0);

      // Find and verify tasks table
      const tasksTable = tables.find((t: any) => t.name === "tasks");
      expect(tasksTable).toBeDefined();
      expect(tasksTable.schema).toBeDefined();
      expect(tasksTable.rowCount).toBeGreaterThanOrEqual(1);

      // Verify our test task is in the export
      if (tasksTable.rows && tasksTable.rows.length > 0) {
        const testTask = tasksTable.rows.find(
          (row: any) =>
            row[1]?.project === "Test Project" &&
            row[1]?.comment === "Test Comment",
        );
        expect(testTask).toBeDefined();
      }
    }
  });

  test("should export database with multiple tasks and projects", async ({
    page,
  }) => {
    // Add multiple tasks with different projects
    const tasks = [
      {
        start: "09:00",
        end: "10:00",
        project: "Project Alpha",
        comment: "Task 1",
      },
      {
        start: "10:00",
        end: "11:00",
        project: "Project Beta",
        comment: "Task 2",
      },
      {
        start: "11:00",
        end: "12:00",
        project: "Project Alpha",
        comment: "Task 3",
      },
    ];

    for (const task of tasks) {
      await page.getByTestId("add-entry-input-start-time").fill(task.start);
      await page.getByTestId("add-entry-input-end-time").fill(task.end);
      await page.getByTestId("add-entry-input-project").fill(task.project);
      await page.getByTestId("add-entry-input-comment").fill(task.comment);
      await page.getByTestId("button-add-task").click();

      await expect(page.getByTestId("button-add-task")).toBeVisible({
        timeout: 5000,
      });
    }

    // Open the navigation by clicking the burger menu
    const burgerMenu = page.getByTestId("navigation-burger");
    await burgerMenu.click();
    await page.waitForTimeout(200);

    // Navigate to Import/Export section
    const importExportNav = page.getByTestId("nav-import-export");
    await importExportNav.click();
    await page.waitForTimeout(200);

    // Set up download listener
    const downloadPromise = page.waitForEvent("download");

    // Click export button
    const exportButton = page.getByTestId("button-export-data");
    await exportButton.click();

    const download = await downloadPromise;
    const downloadPath = await download.path();

    expect(downloadPath).toBeTruthy();

    if (downloadPath) {
      const fileContent = fs.readFileSync(downloadPath, "utf-8");
      const exportedData = JSON.parse(fileContent);

      // Verify all tables are present
      const tables = exportedData.data.tables;
      const tableNames = tables.map((t: any) => t.name);

      expect(tableNames).toContain("tasks");
      expect(tableNames).toContain("projects");
      expect(tableNames).toContain("comments");

      // Verify tasks table has all tasks
      const tasksTable = tables.find((t: any) => t.name === "tasks");
      expect(tasksTable.rowCount).toBeGreaterThanOrEqual(3);

      // Verify projects table has both projects
      const projectsTable = tables.find((t: any) => t.name === "projects");
      expect(projectsTable.rowCount).toBeGreaterThanOrEqual(2);

      // Verify comments table has all comments
      const commentsTable = tables.find((t: any) => t.name === "comments");
      expect(commentsTable.rowCount).toBeGreaterThanOrEqual(3);
    }
  });

  test("should export database with incomplete task", async ({ page }) => {
    // Add a complete task
    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").fill("10:00");
    await page.getByTestId("add-entry-input-project").fill("Complete Project");
    await page.getByTestId("button-add-task").click();

    await expect(page.getByTestId("button-add-task")).toBeVisible({
      timeout: 5000,
    });

    // Add an incomplete task
    await page.getByTestId("add-entry-input-start-time").fill("10:00");
    await page
      .getByTestId("add-entry-input-project")
      .fill("Incomplete Project");
    // Don't fill end time
    await page.getByTestId("button-add-task").click();

    // Wait for incomplete task to appear
    await page.waitForTimeout(500);

    // Open the navigation by clicking the burger menu
    const burgerMenu = page.getByTestId("navigation-burger");
    await burgerMenu.click();
    await page.waitForTimeout(200);

    // Navigate to Import/Export section
    const importExportNav = page.getByTestId("nav-import-export");
    await importExportNav.click();
    await page.waitForTimeout(200);

    // Set up download listener
    const downloadPromise = page.waitForEvent("download");

    // Click export button
    const exportButton = page.getByTestId("button-export-data");
    await exportButton.click();

    const download = await downloadPromise;
    const downloadPath = await download.path();

    expect(downloadPath).toBeTruthy();

    if (downloadPath) {
      const fileContent = fs.readFileSync(downloadPath, "utf-8");
      const exportedData = JSON.parse(fileContent);

      // Verify tasks table has both tasks
      const tables = exportedData.data.tables;
      const tasksTable = tables.find((t: any) => t.name === "tasks");
      expect(tasksTable.rowCount).toBeGreaterThanOrEqual(2);

      // Verify both tasks are in the export
      if (tasksTable.rows && tasksTable.rows.length >= 2) {
        const completeTask = tasksTable.rows.find(
          (row: any) => row[1]?.project === "Complete Project",
        );
        const incompleteTask = tasksTable.rows.find(
          (row: any) => row[1]?.project === "Incomplete Project",
        );

        expect(completeTask).toBeDefined();
        expect(completeTask[1].timeEnd).toBeDefined();

        expect(incompleteTask).toBeDefined();
        expect(incompleteTask[1].timeEnd).toBeUndefined();
      }
    }
  });

  test("should export empty database when no data exists", async ({ page }) => {
    // No tasks added - export should still work

    // Open the navigation by clicking the burger menu
    const burgerMenu = page.getByTestId("navigation-burger");
    await burgerMenu.click();
    await page.waitForTimeout(200);

    // Navigate to Import/Export section
    const importExportNav = page.getByTestId("nav-import-export");
    await importExportNav.click();
    await page.waitForTimeout(200);

    // Set up download listener
    const downloadPromise = page.waitForEvent("download");

    // Click export button
    const exportButton = page.getByTestId("button-export-data");
    await exportButton.click();

    const download = await downloadPromise;
    const downloadPath = await download.path();

    expect(downloadPath).toBeTruthy();

    if (downloadPath) {
      const fileContent = fs.readFileSync(downloadPath, "utf-8");
      const exportedData = JSON.parse(fileContent);

      // Verify valid Dexie export structure
      expect(exportedData.formatName).toBe("dexie");
      expect(exportedData.data.databaseName).toBe("EffortumDatabase");
      expect(Array.isArray(exportedData.data.tables)).toBe(true);

      // Tables might be empty or have 0 row counts
      const tables = exportedData.data.tables;
      tables.forEach((table: any) => {
        expect(table).toHaveProperty("name");
        expect(table).toHaveProperty("schema");
        // rowCount could be 0 for empty database
        expect(table.rowCount).toBeGreaterThanOrEqual(0);
      });
    }
  });

  test("should export database with tasks on different dates", async ({
    page,
  }) => {
    // Add task for today
    await page.getByTestId("add-entry-input-date").click();
    const todayPreset = page
      .locator(".mantine-DatePickerInput-presetButton")
      .filter({ hasText: "Today" });
    await todayPreset.click();

    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").fill("10:00");
    await page.getByTestId("add-entry-input-project").fill("Today's Project");
    await page.getByTestId("button-add-task").click();

    await expect(page.getByTestId("button-add-task")).toBeVisible({
      timeout: 5000,
    });

    // Add task for yesterday
    await page.getByTestId("add-entry-input-date").click();
    const yesterdayPreset = page
      .locator(".mantine-DatePickerInput-presetButton")
      .filter({ hasText: "Yesterday" });
    await yesterdayPreset.click();

    await page.getByTestId("add-entry-input-start-time").fill("14:00");
    await page.getByTestId("add-entry-input-end-time").fill("15:00");
    await page
      .getByTestId("add-entry-input-project")
      .fill("Yesterday's Project");
    await page.getByTestId("button-add-task").click();

    await page.waitForTimeout(500);

    // Open the navigation by clicking the burger menu
    const burgerMenu = page.getByTestId("navigation-burger");
    await burgerMenu.click();
    await page.waitForTimeout(200);

    // Navigate to Import/Export section
    const importExportNav = page.getByTestId("nav-import-export");
    await importExportNav.click();
    await page.waitForTimeout(200);

    // Set up download listener
    const downloadPromise = page.waitForEvent("download");

    // Click export button
    const exportButton = page.getByTestId("button-export-data");
    await exportButton.click();

    const download = await downloadPromise;
    const downloadPath = await download.path();

    expect(downloadPath).toBeTruthy();

    if (downloadPath) {
      const fileContent = fs.readFileSync(downloadPath, "utf-8");
      const exportedData = JSON.parse(fileContent);

      // Verify both tasks are exported (regardless of date filter in UI)
      const tables = exportedData.data.tables;
      const tasksTable = tables.find((t: any) => t.name === "tasks");
      expect(tasksTable.rowCount).toBeGreaterThanOrEqual(2);

      if (tasksTable.rows && tasksTable.rows.length >= 2) {
        const todayTask = tasksTable.rows.find(
          (row: any) => row[1]?.project === "Today's Project",
        );
        const yesterdayTask = tasksTable.rows.find(
          (row: any) => row[1]?.project === "Yesterday's Project",
        );

        expect(todayTask).toBeDefined();
        expect(yesterdayTask).toBeDefined();

        // Verify dates are different
        expect(todayTask[1].date).not.toBe(yesterdayTask[1].date);
      }
    }
  });

  test("should include schema information in export", async ({ page }) => {
    // Open the navigation by clicking the burger menu
    const burgerMenu = page.getByTestId("navigation-burger");
    await burgerMenu.click();
    await page.waitForTimeout(200);

    // Navigate to Import/Export section
    const importExportNav = page.getByTestId("nav-import-export");
    await importExportNav.click();
    await page.waitForTimeout(200);

    // Set up download listener
    const downloadPromise = page.waitForEvent("download");

    // Click export button
    const exportButton = page.getByTestId("button-export-data");
    await exportButton.click();

    const download = await downloadPromise;
    const downloadPath = await download.path();

    expect(downloadPath).toBeTruthy();

    if (downloadPath) {
      const fileContent = fs.readFileSync(downloadPath, "utf-8");
      const exportedData = JSON.parse(fileContent);

      // Verify database version and schema
      expect(exportedData.data).toHaveProperty("databaseVersion");
      expect(exportedData.data.databaseVersion).toBeGreaterThanOrEqual(2);

      // Verify each table has schema definition
      const tables = exportedData.data.tables;
      tables.forEach((table: any) => {
        expect(table.schema).toBeDefined();
        expect(typeof table.schema).toBe("string");
        expect(table.schema.length).toBeGreaterThan(0);
      });

      // Verify tasks table schema contains expected fields
      const tasksTable = tables.find((t: any) => t.name === "tasks");
      if (tasksTable) {
        const schema = tasksTable.schema;
        expect(schema).toContain("++id");
        expect(schema).toContain("date");
      }
    }
  });

  test("should handle multiple consecutive exports", async ({ page }) => {
    // Add a test task
    await page.getByTestId("add-entry-input-start-time").fill("09:00");
    await page.getByTestId("add-entry-input-end-time").fill("10:00");
    await page.getByTestId("add-entry-input-project").fill("Export Test");
    await page.getByTestId("button-add-task").click();

    await expect(page.getByTestId("button-add-task")).toBeVisible({
      timeout: 5000,
    });

    // Open the navigation by clicking the burger menu
    const burgerMenu = page.getByTestId("navigation-burger");
    await burgerMenu.click();
    await page.waitForTimeout(200);

    // Navigate to Import/Export section
    const importExportNav = page.getByTestId("nav-import-export");
    await importExportNav.click();
    await page.waitForTimeout(200);

    // Export multiple times in succession
    const exportButton = page.getByTestId("button-export-data");
    const downloadPaths: string[] = [];

    for (let i = 0; i < 3; i++) {
      const downloadPromise = page.waitForEvent("download");
      await exportButton.click();
      const download = await downloadPromise;
      const downloadPath = await download.path();

      expect(downloadPath).toBeTruthy();
      if (downloadPath) {
        downloadPaths.push(downloadPath);
      }

      // Small delay between exports
      await page.waitForTimeout(100);
    }

    // Verify all exports are valid and contain the same data
    expect(downloadPaths.length).toBe(3);

    const exportData = downloadPaths.map((path) => {
      const content = fs.readFileSync(path, "utf-8");
      return JSON.parse(content);
    });

    // Verify all exports have the same database structure
    for (let i = 1; i < exportData.length; i++) {
      expect(exportData[i].data.databaseName).toBe(
        exportData[0].data.databaseName,
      );
      expect(exportData[i].data.databaseVersion).toBe(
        exportData[0].data.databaseVersion,
      );
      expect(exportData[i].data.tables.length).toBe(
        exportData[0].data.tables.length,
      );
    }
  });
});
