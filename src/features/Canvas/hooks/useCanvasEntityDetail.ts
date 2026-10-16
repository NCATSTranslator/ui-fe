import { useQuery, QueryClient } from '@tanstack/react-query';
import { getNodeDetail, getEdgeDetail } from '@/features/Canvas/utils/canvasApi';
export const CANVAS_DETAIL_STALE_TIME = 5 * 60 * 1000;

export const canvasNodeDetailQueryKey = (canvasId: number, entityId: number) =>
  ['canvasNodeDetail', canvasId, entityId] as const;

export const canvasEdgeDetailQueryKey = (canvasId: number, entityId: number) =>
  ['canvasEdgeDetail', canvasId, entityId] as const;

/* Prefixes matching every cached detail for one canvas. react-query matches query keys by prefix,
 * so these drop all of a canvas's node/edge detail at once — used when sync replaces its graph. */
export const canvasNodeDetailQueryKeyPrefix = (canvasId: number) =>
  ['canvasNodeDetail', canvasId] as const;

export const canvasEdgeDetailQueryKeyPrefix = (canvasId: number) =>
  ['canvasEdgeDetail', canvasId] as const;

const isDetailQueryEnabled = (
  enabled: boolean,
  canvasId: number | undefined,
  entityId: number | undefined,
): canvasId is number =>
  enabled && canvasId !== undefined && entityId !== undefined && entityId > 0;

export const canvasNodeDetailQueryOptions = (canvasId: number, entityId: number) => ({
  queryKey: canvasNodeDetailQueryKey(canvasId, entityId),
  queryFn: () => getNodeDetail(canvasId, entityId),
  staleTime: CANVAS_DETAIL_STALE_TIME,
});

export const canvasEdgeDetailQueryOptions = (canvasId: number, entityId: number) => ({
  queryKey: canvasEdgeDetailQueryKey(canvasId, entityId),
  queryFn: () => getEdgeDetail(canvasId, entityId),
  staleTime: CANVAS_DETAIL_STALE_TIME,
});

export const prefetchCanvasNodeDetail = (queryClient: QueryClient, canvasId: number, entityId: number) => {
  queryClient.prefetchQuery(canvasNodeDetailQueryOptions(canvasId, entityId));
};

export const prefetchCanvasEdgeDetail = (queryClient: QueryClient, canvasId: number, entityId: number) => {
  queryClient.prefetchQuery(canvasEdgeDetailQueryOptions(canvasId, entityId));
};

export const useCanvasNodeDetail = (
  canvasId: number | undefined,
  entityId: number | undefined,
  enabled = true,
) => {
  const detailEnabled = isDetailQueryEnabled(enabled, canvasId, entityId);
  return useQuery({
    ...canvasNodeDetailQueryOptions(canvasId ?? 0, entityId ?? 0),
    enabled: detailEnabled,
    retry: false,
  });
};

export const useCanvasEdgeDetail = (
  canvasId: number | undefined,
  entityId: number | undefined,
  enabled = true,
) => {
  const detailEnabled = isDetailQueryEnabled(enabled, canvasId, entityId);
  return useQuery({
    ...canvasEdgeDetailQueryOptions(canvasId ?? 0, entityId ?? 0),
    enabled: detailEnabled,
    retry: false,
  });
};
