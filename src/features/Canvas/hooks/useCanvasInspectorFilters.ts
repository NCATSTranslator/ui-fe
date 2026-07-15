import { useCallback, useMemo } from 'react';
import type { Path } from '@/features/ResultList/types/results.d';

export interface CanvasInspectorFiltersState {
  hasActiveFilters: boolean;
  isPathFilteredOut: (path: Path) => boolean;
  clearFilters: () => void;
}

const useCanvasInspectorFilters = (
  visibleNodeIds: Set<string>,
  allNodeIds: Set<string>,
  clearSourceFilters: () => void,
): CanvasInspectorFiltersState => {
  const hasActiveFilters = visibleNodeIds.size < allNodeIds.size;

  const isPathFilteredOut = useCallback((path: Path): boolean => {
    if (!hasActiveFilters) return false;
    const pathNodeIds = path.subgraph.filter((_, i) => i % 2 === 0);
    return pathNodeIds.some(id => allNodeIds.has(id as string) && !visibleNodeIds.has(id as string));
  }, [hasActiveFilters, visibleNodeIds, allNodeIds]);

  const clearFilters = useCallback(() => {
    clearSourceFilters();
  }, [clearSourceFilters]);

  return useMemo(() => ({
    hasActiveFilters,
    isPathFilteredOut,
    clearFilters,
  }), [hasActiveFilters, isPathFilteredOut, clearFilters]);
};

export default useCanvasInspectorFilters;
