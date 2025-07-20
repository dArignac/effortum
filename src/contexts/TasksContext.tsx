import React, { createContext, useContext, useState, useEffect } from "react";
import { Task } from "../models/Task";
import { getItem, setItem } from "../utils/local-storage";

type TaskContextType = {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
};

const TasksContext = createContext<TaskContextType | undefined>(undefined);

export const TasksProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const storedTasks = getItem("tasks") ?? [];
    return storedTasks.sort((a: Task, b: Task) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      if (a.timeStart !== b.timeStart) {
        return a.timeStart.localeCompare(b.timeStart);
      }
      if (a.timeEnd && b.timeEnd) {
        return a.timeEnd.localeCompare(b.timeEnd);
      }
      return 0;
    });
  });

  useEffect(() => {
    setItem("tasks", tasks);
  }, [tasks]);

  return (
    <TasksContext.Provider value={{ tasks, setTasks }}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasksContext = () => {
  const context = useContext(TasksContext);
  if (!context)
    throw new Error("useTaskContext must be used within a TaskProvider");
  return context;
};
