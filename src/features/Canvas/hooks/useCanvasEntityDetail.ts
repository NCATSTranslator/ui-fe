import { useQuery, QueryClient } from '@tanstack/react-query';
import { getNodeDetail, getEdgeDetail } from '@/features/Canvas/utils/canvasApi';
export const CANVAS_DETAIL_STALE_TIME = 5 * 60 * 1000;

export const canvasNodeDetailQueryKey = (canvasId: number, dataId: number) =>
  ['canvasNodeDetail', canvasId, dataId] as const;

export const canvasEdgeDetailQueryKey = (canvasId: number, dataId: number) =>
  ['canvasEdgeDetail', canvasId, dataId] as const;

/* Prefixes matching every cached detail for one canvas. react-query matches query keys by prefix,
 * so these drop all of a canvas's node/edge detail at once — used when sync replaces its graph. */
export const canvasNodeDetailQueryKeyPrefix = (canvasId: number) =>
  ['canvasNodeDetail', canvasId] as const;

export const canvasEdgeDetailQueryKeyPrefix = (canvasId: number) =>
  ['canvasEdgeDetail', canvasId] as const;

const isDetailQueryEnabled = (
  enabled: boolean,
  canvasId: number | undefined,
  dataId: number | undefined,
): canvasId is number =>
  enabled && canvasId !== undefined && dataId !== undefined && dataId > 0;

export const canvasNodeDetailQueryOptions = (canvasId: number, dataId: number) => ({
  queryKey: canvasNodeDetailQueryKey(canvasId, dataId),
  queryFn: () => getNodeDetail(canvasId, dataId),
  staleTime: CANVAS_DETAIL_STALE_TIME,
});

export const canvasEdgeDetailQueryOptions = (canvasId: number, dataId: number) => ({
  queryKey: canvasEdgeDetailQueryKey(canvasId, dataId),
  queryFn: () => getEdgeDetail(canvasId, dataId),
  staleTime: CANVAS_DETAIL_STALE_TIME,
});

export const prefetchCanvasNodeDetail = (queryClient: QueryClient, canvasId: number, dataId: number) => {
  queryClient.prefetchQuery(canvasNodeDetailQueryOptions(canvasId, dataId));
};

export const prefetchCanvasEdgeDetail = (queryClient: QueryClient, canvasId: number, dataId: number) => {
  queryClient.prefetchQuery(canvasEdgeDetailQueryOptions(canvasId, dataId));
};

export const useCanvasNodeDetail = (
  canvasId: number | undefined,
  dataId: number | undefined,
  enabled = true,
) => {
  const detailEnabled = isDetailQueryEnabled(enabled, canvasId, dataId);
  return useQuery({
    ...canvasNodeDetailQueryOptions(canvasId ?? 0, dataId ?? 0),
    enabled: detailEnabled,
    retry: false,
  });
};

export const useCanvasEdgeDetail = (
  canvasId: number | undefined,
  dataId: number | undefined,
  enabled = true,
) => {
  const detailEnabled = isDetailQueryEnabled(enabled, canvasId, dataId);
  return useQuery({
    ...canvasEdgeDetailQueryOptions(canvasId ?? 0, dataId ?? 0),
    enabled: detailEnabled,
    retry: false,
  });
};
