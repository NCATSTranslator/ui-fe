import { UserQueryObject } from "@/features/Projects/types/projects.d";
import { Project } from "@/features/Projects/types/projects.d";
import type { Path } from "@/features/ResultList/types/results";

export type DraggableType = 'query' | 'project' | 'node' | 'edge' | 'path';
export type DroppableAreaType = 'project' | 'canvas';

export type ResultEntityDragData = {
  id: string;
  pk: string;
  path?: Path;
  /** 1-based path index within the result's formatted path list */
  pathNumber?: number;
  /** Result item id (for path overlay "RESULT_NAME Path X") */
  resultId?: string;
};

export type DraggableData =
  | { type: 'query'; data: UserQueryObject }
  | { type: 'project'; data: Project }
  | { type: 'node'; data: ResultEntityDragData }
  | { type: 'edge'; data: ResultEntityDragData }
  | { type: 'path'; data: ResultEntityDragData & { path: Path } };


export type DroppableAreaData = {
  type: DroppableAreaType;
  id?: string;
  onDrop?: (draggedData: DraggableData) => void;
}
