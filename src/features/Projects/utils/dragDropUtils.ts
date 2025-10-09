import { DraggableData } from "@/features/DragAndDrop/types/types";
import { Project, isUserQueryObject } from "@/features/Projects/types/projects.d";

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
    console.log('Dropped data:', draggedItem);
    // if query does not exist in project, add it
    
    if(project?.id && isUserQueryObject(draggedItem.data) && !projectQIds.some((q: string) => q === draggedItem.data.data.qid)) {
      console.log('Adding query to project:', draggedItem.data.data.qid);
      handleUpdateProject(project?.id?.toString(), undefined, [...projectQIds, draggedItem.data.data.qid]);
    }
  }
}