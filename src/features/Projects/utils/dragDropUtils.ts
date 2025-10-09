import { DraggableData } from "@/features/DragAndDrop/types/types";
import { Project, isUserQueryObject } from "@/features/Projects/types/projects.d";
import { toast } from "react-toastify";

/**
 * Handles the dropping of a query into a project. (WRAP IN A USECALLBACK IF PROVIDING TO DroppableArea)
 * @param {DraggableData} draggedItem - The dragged item data.
 * @param {Project} project - The project to drop the query into.
 * @param {string[]} projectQIds - The qids in the project.
 * @param {function} handleUpdateProject - The function to update the project.
 */
export const handleQueryDrop = (
  draggedItem: DraggableData,
  project: Project,
  projectQIds: string[],
  handleUpdateProject: (id: number | string, newName?: string, newQids?: string[]) => void) => {
  if (draggedItem.type === 'query') {
    // if query does not exist in project, add it
    const isQueryInProject = projectQIds.some((q: string) => q === draggedItem.data.data.qid);
    if(isQueryInProject) {
      toast.error('Query already in project');
      return;
    }
    if(!project?.id || !isUserQueryObject(draggedItem.data)) {
      console.error('No project or query found');
      return;
    }
    
    handleUpdateProject(project?.id?.toString(), undefined, [...projectQIds, draggedItem.data.data.qid]);
  }
}