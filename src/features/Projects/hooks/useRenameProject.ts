import { Project } from "@/features/Projects/types/projects.d";
import { useEditProjectHandlers } from "@/features/Projects/utils/editUpdateFunctions";

/**
 * Hook to rename a project.
 * @param project - The project to rename.
 * @returns {Object} An object with a handleRenameProject function.
 */
export const useRenameProject = () => {
  const { handleUpdateProject } = useEditProjectHandlers();

  const handleRenameProject = (project: Project, newName: string) => {
    handleUpdateProject(project.id, newName);
  }

  return {
    handleRenameProject: handleRenameProject
  }
}