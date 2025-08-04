import { Task } from "./models/Task";

const DB_NAME = "effortum";
const DB_STORES = ["tasks", "projects"];

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result as IDBDatabase;
      DB_STORES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: "id" });
        }
      });
    };
    request.onerror = (e) => {
      reject("Error opening database");
    };
    request.onsuccess = (e) => {
      resolve((e.target as IDBRequest).result);
    };
  });
};

export const getProjects = async (): Promise<string[]> => {
  const db = await openDB();
  const transaction = db.transaction(DB_STORES[1], "readonly");
  const store = transaction.objectStore(DB_STORES[1]);
  let projects: string[] = [];
  store.openCursor("null", "next").onsuccess = (event) => {
    const cursor = (event.target as IDBRequest).result;
    if (cursor) {
      projects.push(cursor.value);
      cursor.continue();
    }
  };
  return projects;
};

export const updateProject = async (project: string): Promise<string> => {
  const db = await openDB();
  const transaction = db.transaction(DB_STORES[1], "readwrite");
  const store = transaction.objectStore(DB_STORES[1]);
  store.put(project);
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve(project);
    transaction.onerror = () => reject("Error updating project");
  });
};

export const getTasks = async (): Promise<Task[]> => {
  const db = await openDB();
  const transaction = db.transaction(DB_STORES[0], "readonly");
  const store = transaction.objectStore(DB_STORES[0]);
  let tasks: Task[] = [];
  store.openCursor("null", "next").onsuccess = (event) => {
    const cursor = (event.target as IDBRequest).result;
    if (cursor) {
      tasks.push(cursor.value);
      cursor.continue();
    }
  };
  return tasks;
};

export const updateTask = async (task: Task): Promise<Task> => {
  const db = await openDB();
  const transaction = db.transaction(DB_STORES[0], "readwrite");
  const store = transaction.objectStore(DB_STORES[0]);
  store.put(task);
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve(task);
    transaction.onerror = () => reject("Error updating task");
  });
};

// FIXME handle
// loadedTasks = loadedTasks.sort((a: Task, b: Task) => {
//           if (a.date !== b.date) {
//             return a.date.localeCompare(b.date);
//           }
//           if (a.timeStart !== b.timeStart) {
//             return a.timeStart.localeCompare(b.timeStart);
//           }
//           if (a.timeEnd && b.timeEnd) {
//             return a.timeEnd.localeCompare(b.timeEnd);
//           }
//           if (a.timeEnd && !b.timeEnd) {
//             return 1;
//           }
//           if (!a.timeEnd && b.timeEnd) {
//             return -1;
//           }
//           return 0;
//         });
