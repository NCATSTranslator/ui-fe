import type { BackendUserCanvas, Canvas, CanvasNode } from '@/features/Canvas/types/canvas';

export const makeCanvas = (overrides: Partial<Canvas> = {}): Canvas => ({
  id: 1,
  label: 'Canvas',
  layout: 'horizontal',
  nodes: {},
  edges: {},
  tags: null,
  queryRef: null,
  resultRef: null,
  annotations: [],
  timeCreated: '2026-01-01T00:00:00.000Z',
  timeUpdated: '2026-01-01T00:00:00.000Z',
  serverTimeUpdated: '2026-01-01T00:00:00.000Z',
  graphLoaded: true,
  ...overrides,
});

export const makeMeta = (overrides: Partial<BackendUserCanvas> = {}): BackendUserCanvas => ({
  user_id: 'user-1',
  id: 1,
  label: 'Canvas',
  layout: 'horizontal',
  data: { tags: null, query_ref: null, result_ref: null },
  time_created: '2026-01-01T00:00:00.000Z',
  time_updated: '2026-01-01T00:00:00.000Z',
  time_deleted: null,
  ...overrides,
});

export const makeCanvasNode = (id: string, overrides: Partial<CanvasNode> = {}): CanvasNode => ({
  id,
  dataId: 1,
  ref: id,
  names: [id],
  types: ['biolink:NamedThing'],
  curies: [id],
  x: 0,
  y: 0,
  hidden: false,
  tags: {},
  ...overrides,
});
