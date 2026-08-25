import type { LayoutType } from 'translator-graph-view';
import type { CanvasLayout } from '@/features/Canvas/types/canvas';

const canvasToGraphLayoutMap: Record<CanvasLayout, LayoutType> = {
  horizontal: 'hierarchicalLR',
  vertical: 'hierarchical',
  concentric: 'force',
  custom: 'custom',
};

// grid/radial are not exposed in the canvas toolbar; map to horizontal if ever requested.
const graphToCanvasLayoutMap: Record<Exclude<LayoutType, 'custom'>, CanvasLayout> = {
  hierarchicalLR: 'horizontal',
  hierarchical: 'vertical',
  force: 'concentric',
  grid: 'horizontal',
  radial: 'horizontal',
};

export const canvasLayoutToGraphLayout = (layout: CanvasLayout): LayoutType =>
  canvasToGraphLayoutMap[layout];

export const graphLayoutToCanvasLayout = (layout: LayoutType): CanvasLayout => {
  if (layout === 'custom') {
    return 'custom';
  }
  return graphToCanvasLayoutMap[layout];
};

export const isCustomCanvasLayout = (layout: CanvasLayout): boolean => layout === 'custom';

export const isAutoGraphLayout = (layout: LayoutType): boolean => layout !== 'custom';
