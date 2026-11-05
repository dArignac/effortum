import { useEffect, useState } from "react";
import { useEffortumStore } from "../store";

export function useProjectComments(projectName: string) {
  const projects = useEffortumStore((state) => state.projects);
  const tasks = useEffortumStore((state) => state.tasks);
  const getRecentTaskCommentsForProject = useEffortumStore(
    (state) => state.getRecentTaskCommentsForProject,
  );

  const [availableComments, setAvailableComments] = useState<string[]>([]);
  const [isCommentLoading, setIsCommentLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadComments = async () => {
      const trimmedProject = projectName.trim();
      if (trimmedProject.length === 0) {
        setAvailableComments([]);
        setIsCommentLoading(false);
        return;
      }

      const project = projects.find((p) => p.name === trimmedProject);
      if (!project) {
        setAvailableComments([]);
        setIsCommentLoading(false);
        return;
      }

      setIsCommentLoading(true);
      try {
        const comments = await getRecentTaskCommentsForProject(project.id);
        if (!isCancelled) {
          setAvailableComments(comments);
        }
      } catch (error) {
        console.error("Failed to load comments:", error);
        if (!isCancelled) {
          setAvailableComments([]);
        }
      } finally {
        if (!isCancelled) {
          setIsCommentLoading(false);
        }
      }
    };

    void loadComments();

    return () => {
      isCancelled = true;
    };
  }, [projectName, projects, tasks, getRecentTaskCommentsForProject]);

  return { availableComments, isCommentLoading };
}
