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
  type CanvasObjectListTab,
} from '@/features/Canvas/components/CanvasObjectList/canvasObjectListConstants';

interface UseCanvasObjectListOptions {
  canvas: Canvas;
  visibleNodes?: Record<string, CanvasNode>;
  onFindNode: (nodeId: string) => void;
  onAction?: (action: CanvasNodeAction, node: CanvasNode) => void;
  onAnnotationAction?: (action: CanvasAnnotationAction, annotation: CanvasAnnotation) => void;
  nodeMenuId: string | null;
  onNodeMenuIdChange: (nodeId: string | null) => void;
}

const useCanvasObjectList = ({
  canvas,
  visibleNodes,
  onFindNode,
  onAction,
  onAnnotationAction,
  nodeMenuId,
  onNodeMenuIdChange,
}: UseCanvasObjectListOptions) => {
  const [collapsed, setCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<CanvasObjectListTab>('objects');
  const { searchTerm, handleSearch } = useSimpleSearch();
  const [sortMode, setSortMode] = useState<ObjectSortMode>('relationships');
  const [annotationSortMode, setAnnotationSortMode] = useState<AnnotationSortMode>('alphabetical');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const prevTabRef = useRef(activeTab);

  const allNodes = useMemo(
    () => Object.values(visibleNodes ?? canvas.nodes),
    [visibleNodes, canvas.nodes],
  );
  const allAnnotations = canvas.annotations;

  const sortedNodes = useMemo(
    () => sortCanvasNodes(filterCanvasNodes(allNodes, searchTerm), sortMode, canvas),
    [allNodes, searchTerm, sortMode, canvas.edges],
  );

  const sortedAnnotations = useMemo(
    () => sortCanvasAnnotations(filterCanvasAnnotations(allAnnotations, searchTerm), annotationSortMode),
    [allAnnotations, searchTerm, annotationSortMode],
  );

  useEffect(() => {
    if (prevTabRef.current === activeTab) return;
    prevTabRef.current = activeTab;
    onNodeMenuIdChange(null);
    handleSearch('');
    setSortDropdownOpen(false);
  }, [activeTab, onNodeMenuIdChange, handleSearch]);

  const handleItemClick = useCallback((itemId: string) => {
    onFindNode(itemId);
  }, [onFindNode]);

  const handleMenuToggle = useCallback((itemId: string, e: MouseEvent) => {
    e.stopPropagation();
    onNodeMenuIdChange(nodeMenuId === itemId ? null : itemId);
  }, [nodeMenuId, onNodeMenuIdChange]);

  const handleNodeMenuAction = useCallback((action: CanvasNodeAction, node: CanvasNode) => {
    onNodeMenuIdChange(null);
    onAction?.(action, node);
  }, [onAction, onNodeMenuIdChange]);

  const handleAnnotationMenuAction = useCallback((
    action: CanvasAnnotationAction,
    annotation: CanvasAnnotation,
  ) => {
    onNodeMenuIdChange(null);
    onAnnotationAction?.(action, annotation);
  }, [onAnnotationAction, onNodeMenuIdChange]);

  const handleCloseMenu = useCallback(() => onNodeMenuIdChange(null), [onNodeMenuIdChange]);

  const toggleCollapse = useCallback(() => setCollapsed(prev => !prev), []);

  const activeSortKey = activeTab === 'objects' ? sortMode : annotationSortMode;

  const currentSortLabel = (activeTab === 'objects' ? OBJECT_SORT_OPTIONS : ANNOTATION_SORT_OPTIONS)
    .find(o => o.key === activeSortKey)?.label ?? '';

  const handleSortSelect = useCallback((key: ObjectSortMode | AnnotationSortMode) => {
    if (activeTab === 'objects') {
      setSortMode(key as ObjectSortMode);
    } else {
      setAnnotationSortMode(key as AnnotationSortMode);
    }
    setSortDropdownOpen(false);
  }, [activeTab]);

  const toggleSortDropdown = useCallback(() => setSortDropdownOpen(prev => !prev), []);
  const closeSortDropdown = useCallback(() => setSortDropdownOpen(false), []);

  const searchPlaceholder = activeTab === 'objects' ? 'Search objects...' : 'Search annotations...';

  return {
    collapsed,
    toggleCollapse,
    activeTab,
    setActiveTab,
    searchTerm,
    handleSearch,
    sortDropdownOpen,
    toggleSortDropdown,
    closeSortDropdown,
    activeSortKey,
    currentSortLabel,
    handleSortSelect,
    searchPlaceholder,
    allNodes,
    allAnnotations,
    sortedNodes,
    sortedAnnotations,
    handleItemClick,
    handleMenuToggle,
    handleNodeMenuAction,
    handleAnnotationMenuAction,
    handleCloseMenu,
  };
};

export default useCanvasObjectList;
