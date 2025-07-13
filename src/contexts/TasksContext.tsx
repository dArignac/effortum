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
    return getItem("tasks") ?? [];
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
