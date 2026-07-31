export type CanvasNodeAction = 'newQuery' | 'information' | 'find' | 'remove';

export interface CanvasNodeActionConfig {
  action: CanvasNodeAction;
  label: string;
  showInObjectList: boolean;
  showInContextMenu: boolean;
}

export const CANVAS_NODE_ACTIONS: CanvasNodeActionConfig[] = [
  { action: 'information', label: 'Information', showInObjectList: true, showInContextMenu: true },
  { action: 'newQuery', label: 'New Query', showInObjectList: true, showInContextMenu: true },
  { action: 'find', label: 'Find on Canvas', showInObjectList: true, showInContextMenu: false },
  { action: 'remove', label: 'Remove from Canvas', showInObjectList: true, showInContextMenu: true },
];

export const OBJECT_LIST_NODE_ACTIONS = CANVAS_NODE_ACTIONS.filter(a => a.showInObjectList);
export const CONTEXT_MENU_NODE_ACTIONS = CANVAS_NODE_ACTIONS.filter(a => a.showInContextMenu);
