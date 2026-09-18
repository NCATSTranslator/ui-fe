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
  onAnnotationAction?: (action: CanvasAnnotationAction, annotation: CanvasAnnotation) => void;
  onNodeMenu: (nodeId: string, position: { x: number; y: number }) => void;
  onCloseNodeMenus?: () => void;
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
  const toggleSortDropdown = useCallback(() => setSortDropdownOpen(prev => !prev), []);
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
    toggleSortDropdown,
    closeSortDropdown,
  };
};

const useCanvasObjectListItems = (
  canvas: Canvas,
  visibleNodes: Record<string, CanvasNode> | undefined,
  searchTerm: string,
  sortMode: ObjectSortMode,
  annotationSortMode: AnnotationSortMode,
) => {
  const allNodes = useMemo(
    () => Object.values(visibleNodes ?? canvas.nodes),
    [visibleNodes, canvas.nodes],
  );
  const activeSearchTerm = useMemo(
    () => (searchTerm.length >= CANVAS_OBJECT_LIST_MIN_SEARCH_LENGTH ? searchTerm : ''),
    [searchTerm],
  );
  const sortedNodes = useMemo(
    () => sortCanvasNodes(filterCanvasNodes(allNodes, activeSearchTerm), sortMode, canvas.edges),
    [allNodes, activeSearchTerm, sortMode, canvas.edges],
  );
  const sortedAnnotations = useMemo(
    () => sortCanvasAnnotations(
      filterCanvasAnnotations(canvas.annotations, activeSearchTerm),
      annotationSortMode,
    ),
    [canvas.annotations, activeSearchTerm, annotationSortMode],
  );

  return { allNodes, activeSearchTerm, sortedNodes, sortedAnnotations };
};

const useCanvasObjectList = ({
  canvas,
  visibleNodes,
  onFindNode,
  onFindAnnotation,
  onAnnotationAction,
  onNodeMenu,
  onCloseNodeMenus,
}: UseCanvasObjectListOptions) => {
  const [collapsed, setCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<CanvasObjectListTab>('objects');
  const [annotationMenuId, setAnnotationMenuId] = useState<string | null>(null);
  const { inputValue, searchTerm, handleSearch } = useSimpleSearch();
  const {
    sortMode, annotationSortMode, sortDropdownOpen, activeSortKey, currentSortLabel,
    searchPlaceholder, handleSortSelect, toggleSortDropdown, closeSortDropdown,
  } = useObjectListSortState(activeTab);
  const prevTabRef = useRef(activeTab);
  const { allNodes, activeSearchTerm, sortedNodes, sortedAnnotations } = useCanvasObjectListItems(
    canvas,
    visibleNodes,
    searchTerm,
    sortMode,
    annotationSortMode,
  );

  useEffect(() => {
    if (prevTabRef.current === activeTab) return;
    prevTabRef.current = activeTab;
    setAnnotationMenuId(null);
    handleSearch('');
    closeSortDropdown();
  }, [activeTab, handleSearch, closeSortDropdown]);

  const handleMenuToggle = useCallback((itemId: string, e: MouseEvent) => {
    e.stopPropagation();
    onCloseNodeMenus?.();
    setAnnotationMenuId(current => (current === itemId ? null : itemId));
  }, [onCloseNodeMenus]);

  const handleNodeMenu = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setAnnotationMenuId(null);
    onNodeMenu(nodeId, position);
  }, [onNodeMenu]);
  const toggleCollapse = useCallback(() => setCollapsed(prev => !prev), []);
  const handleNodeClick = useCallback((nodeId: string) => onFindNode(nodeId), [onFindNode]);
  const handleAnnotationClick = useCallback(
    (annotationId: string) => onFindAnnotation(annotationId),
    [onFindAnnotation],
  );
  const handleAnnotationMenuAction = useCallback((
    action: CanvasAnnotationAction,
    annotation: CanvasAnnotation,
  ) => {
    setAnnotationMenuId(null);
    onAnnotationAction?.(action, annotation);
  }, [onAnnotationAction]);
  const handleCloseMenu = useCallback(() => setAnnotationMenuId(null), []);

  return {
    collapsed,
    toggleCollapse,
    activeTab, setActiveTab, inputValue,
    searchTerm: activeSearchTerm, handleSearch,
    sortDropdownOpen, toggleSortDropdown, closeSortDropdown,
    activeSortKey, currentSortLabel, handleSortSelect, searchPlaceholder,
    allNodes, allAnnotations: canvas.annotations, sortedNodes, sortedAnnotations,
    annotationMenuId,
    handleNodeClick,
    handleAnnotationClick,
    handleNodeMenu,
    handleMenuToggle,
    handleAnnotationMenuAction,
    handleCloseMenu,
  };
};

export default useCanvasObjectList;
