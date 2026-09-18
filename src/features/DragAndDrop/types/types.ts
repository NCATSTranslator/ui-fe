import { UserQueryObject } from "@/features/Projects/types/projects.d";
import { Project } from "@/features/Projects/types/projects.d";
import type { Path } from "@/features/ResultList/types/results";

export const RESULT_ENTITY_DRAG_TYPES = ['node', 'edge', 'path', 'result'] as const;
export type ResultEntityDragType = typeof RESULT_ENTITY_DRAG_TYPES[number];

export type DraggableType = 'query' | 'project' | ResultEntityDragType;
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
  | { type: 'edge'; data: ResultEntityDragData & { edgeIds: string[] } }
  | { type: 'path'; data: ResultEntityDragData & { path: Path } }
  | { type: 'result'; data: ResultEntityDragData };

export type ResultEntityDraggableData = Extract<DraggableData, { type: ResultEntityDragType }>;

export const isResultEntityDragType = (type: unknown): type is ResultEntityDragType =>
  typeof type === 'string'
  && (RESULT_ENTITY_DRAG_TYPES as readonly string[]).includes(type);

export const isResultEntityDragData = (data: DraggableData): data is ResultEntityDraggableData =>
  isResultEntityDragType(data.type);

export type DroppableAreaData = {
  type: DroppableAreaType;
  id?: string;
  onDrop?: (draggedData: DraggableData) => void;
}
