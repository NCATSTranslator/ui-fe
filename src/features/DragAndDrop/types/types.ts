
export type DraggableType = 'query' | 'project';
export type DroppableAreaType = 'project';

export type DraggableData = {
  type: DraggableType;
  data: any;
}

export type DroppableAreaData = {
  type: DroppableAreaType;
  id?: string;
  onDrop?: (draggedData: DraggableData) => void;
}