export type CanvasAnnotationAction = 'find' | 'remove';

export interface CanvasAnnotationActionConfig {
  action: CanvasAnnotationAction;
  label: string;
}

export const OBJECT_LIST_ANNOTATION_ACTIONS: CanvasAnnotationActionConfig[] = [
  { action: 'find', label: 'Find on Canvas' },
  { action: 'remove', label: 'Remove from Canvas' },
];
