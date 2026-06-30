import { UserQueryObject } from "@/features/Projects/types/projects.d";
import { Project } from "@/features/Projects/types/projects.d";

export type DraggableType = 'query' | 'project';
export type DroppableAreaType = 'project';

export type DraggableData =
  | { type: 'query'; data: UserQueryObject }
  | { type: 'project'; data: Project };


export type DroppableAreaData = {
  type: DroppableAreaType;
  id?: string;
  onDrop?: (draggedData: DraggableData) => void;
}