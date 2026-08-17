import { useState, useMemo, useCallback, MouseEvent, useEffect, useRef } from 'react';
import type { Canvas, CanvasAnnotation, CanvasNode } from '@/features/Canvas/types/canvas';
import { useSimpleSearch } from '@/features/Core/hooks/simpleSearchHook';
import {
  ObjectSortMode,
  AnnotationSortMode,
  sortCanvasNodes,
  filterCanvasNodes,
  sortCanvasAnnotations,
  filterCanvasAnnotations,
} from '@/features/Canvas/utils/canvasFunctions';
import type { CanvasNodeAction } from '@/features/Canvas/constants/canvasNodeActions';
import type { CanvasAnnotationAction } from '@/features/Canvas/constants/canvasAnnotationActions';
import {
  ANNOTATION_SORT_OPTIONS,
  OBJECT_SORT_OPTIONS,
  CANVAS_OBJECT_LIST_MIN_SEARCH_LENGTH,
  type CanvasObjectListTab,
} from '@/features/Canvas/components/CanvasObjectList/canvasObjectListConstants';

interface UseCanvasObjectListOptions {
  canvas: Canvas;
  visibleNodes?: Record<string, CanvasNode>;
  onFindNode: (nodeId: string) => void;
  onFindAnnotation: (annotationId: string) => void;
  onAction?: (action: CanvasNodeAction, node: CanvasNode) => void;
  onAnnotationAction?: (action: CanvasAnnotationAction, annotation: CanvasAnnotation) => void;
  nodeMenuId: string | null;
  onNodeMenuIdChange: (nodeId: string | null) => void;
}

const useObjectListSortState = (activeTab: CanvasObjectListTab) => {
  const [sortMode, setSortMode] = useState<ObjectSortMode>('relationships');
  const [annotationSortMode, setAnnotationSortMode] = useState<AnnotationSortMode>('alphabetical');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const activeSortKey = activeTab === 'objects' ? sortMode : annotationSortMode;
  const options = activeTab === 'objects' ? OBJECT_SORT_OPTIONS : ANNOTATION_SORT_OPTIONS;
  const currentSortLabel = options.find(o => o.key === activeSortKey)?.label ?? '';
  const searchPlaceholder = activeTab === 'objects' ? 'Search objects...' : 'Search annotations...';
  const closeSortDropdown = useCallback(() => setSortDropdownOpen(false), []);
  const handleSortSelect = useCallback((key: ObjectSortMode | AnnotationSortMode) => {
    if (activeTab === 'objects') setSortMode(key as ObjectSortMode);
    else setAnnotationSortMode(key as AnnotationSortMode);
    setSortDropdownOpen(false);
  }, [activeTab]);

  return {
    sortMode,
    annotationSortMode,
    sortDropdownOpen,
    activeSortKey,
    currentSortLabel,
    searchPlaceholder,
    handleSortSelect,
    toggleSortDropdown: useCallback(() => setSortDropdownOpen(prev => !prev), []),
    closeSortDropdown,
  };
};

const useCanvasObjectList = ({
  canvas,
  visibleNodes,
  onFindNode,
  onFindAnnotation,
  onAction,
  onAnnotationAction,
  nodeMenuId,
  onNodeMenuIdChange,
}: UseCanvasObjectListOptions) => {
  const [collapsed, setCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<CanvasObjectListTab>('objects');
  const { inputValue, searchTerm, handleSearch } = useSimpleSearch();
  const {
    sortMode, annotationSortMode, sortDropdownOpen, activeSortKey, currentSortLabel,
    searchPlaceholder, handleSortSelect, toggleSortDropdown, closeSortDropdown,
  } = useObjectListSortState(activeTab);
  const prevTabRef = useRef(activeTab);
  const allNodes = useMemo(
    () => Object.values(visibleNodes ?? canvas.nodes),
    [visibleNodes, canvas.nodes],
  );
  const activeSearchTerm = useMemo(
    () => (searchTerm.length >= CANVAS_OBJECT_LIST_MIN_SEARCH_LENGTH ? searchTerm : ''),
    [searchTerm],
  );
  const sortedNodes = useMemo(
    () => sortCanvasNodes(filterCanvasNodes(allNodes, activeSearchTerm), sortMode, canvas),
    [allNodes, activeSearchTerm, sortMode, canvas],
  );
  const sortedAnnotations = useMemo(
    () => sortCanvasAnnotations(
      filterCanvasAnnotations(canvas.annotations, activeSearchTerm),
      annotationSortMode,
    ),
    [canvas.annotations, activeSearchTerm, annotationSortMode],
  );

  useEffect(() => {
    if (prevTabRef.current === activeTab) return;
    prevTabRef.current = activeTab;
    onNodeMenuIdChange(null);
    handleSearch('');
    closeSortDropdown();
  }, [activeTab, onNodeMenuIdChange, handleSearch, closeSortDropdown]);

  const handleMenuToggle = useCallback((itemId: string, e: MouseEvent) => {
    e.stopPropagation();
    onNodeMenuIdChange(nodeMenuId === itemId ? null : itemId);
  }, [nodeMenuId, onNodeMenuIdChange]);

  return {
    collapsed,
    toggleCollapse: useCallback(() => setCollapsed(prev => !prev), []),
    activeTab, setActiveTab, inputValue,
    searchTerm: activeSearchTerm, handleSearch,
    sortDropdownOpen, toggleSortDropdown, closeSortDropdown,
    activeSortKey, currentSortLabel, handleSortSelect, searchPlaceholder,
    allNodes, allAnnotations: canvas.annotations, sortedNodes, sortedAnnotations,
    handleNodeClick: useCallback((nodeId: string) => onFindNode(nodeId), [onFindNode]),
    handleAnnotationClick: useCallback(
      (annotationId: string) => onFindAnnotation(annotationId),
      [onFindAnnotation],
    ),
    handleMenuToggle,
    handleNodeMenuAction: useCallback((action: CanvasNodeAction, node: CanvasNode) => {
      onNodeMenuIdChange(null);
      onAction?.(action, node);
    }, [onAction, onNodeMenuIdChange]),
    handleAnnotationMenuAction: useCallback((
      action: CanvasAnnotationAction,
      annotation: CanvasAnnotation,
    ) => {
      onNodeMenuIdChange(null);
      onAnnotationAction?.(action, annotation);
    }, [onAnnotationAction, onNodeMenuIdChange]),
    handleCloseMenu: useCallback(() => onNodeMenuIdChange(null), [onNodeMenuIdChange]),
  };
};

export default useCanvasObjectList;
