import React, { createContext, useContext, useEffect, useState } from "react";
import { getItem, setItem } from "../utils/local-storage";

type ProjectsContextType = {
  projects: string[];
  setProjects: React.Dispatch<React.SetStateAction<string[]>>;
};

const ProjectsContext = createContext<ProjectsContextType | undefined>(
  undefined,
);

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [projects, setProjects] = useState<string[]>(() => {
    return (getItem("projects") ?? []).sort();
  });

  useEffect(() => {
    setItem("projects", [...projects].sort());
  }, [projects]);

  return (
    <ProjectsContext.Provider
      value={{ projects: projects, setProjects: setProjects }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjectsContext = () => {
  const context = useContext(ProjectsContext);
  if (!context)
    throw new Error("useProjectsContext must be used within a TaskProvider");
  return context;
};
