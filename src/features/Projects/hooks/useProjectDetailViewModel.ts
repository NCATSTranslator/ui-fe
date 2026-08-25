import { useCallback, useMemo, useState, MouseEvent } from 'react';
import { useSortSearchState } from '@/features/Projects/hooks/customHooks';
import { useEditProjectHandlers } from '@/features/Projects/hooks/useEditProjectHandlers';
import { useProjectDetailData } from '@/features/Projects/hooks/useProjectDetailData';
import { useProjectDetailSortedData } from '@/features/Projects/hooks/useProjectDetailSortedData';
import { DraggableData } from '@/features/DragAndDrop/types/types';
import { handleQueryDrop } from '@/features/Projects/utils/dragDropUtils';
import { useDndContext } from '@dnd-kit/core';
import { useProjectModals } from '@/features/Projects/hooks/useProjectModals';
import { useRenameProject } from '@/features/Projects/hooks/useRenameProject';
import { useAnimateHeight } from '@/features/Core/hooks/useAnimateHeight';
import { useSidebar } from '@/features/Sidebar/hooks/sidebarHooks';
import { useDynamicPageTitle } from '@/features/Page/hooks/usePageTitle';
import type { Project } from '@/features/Projects/types/projects';

const useProjectDetailDragState = (project: Project | undefined) => {
  const { active } = useDndContext();
  const { handleUpdateProject } = useEditProjectHandlers();

  const isDraggedQueryInProject = useMemo(() => {
    if (!active?.data.current) return false;
    const draggedQid = active.data.current.data.data.qid;
    const projectQids = project?.data.pks || [];
    return active.data.current.type === 'query' && projectQids.includes(draggedQid);
  }, [active, project]);

  const onQueryDrop = useCallback((draggedItem: DraggableData) => {
    if (project) {
      handleQueryDrop(draggedItem, project, project.data.pks, handleUpdateProject);
    } else {
      console.error('No project found');
    }
  }, [project, handleUpdateProject]);

  return { isDraggedQueryInProject, onQueryDrop };
};

/** Data, rename, drag, and sort state for the project detail page. */
export const useProjectDetailViewModel = () => {
  const data = useProjectDetailData();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const projectsLoading = data.loading.projectsLoading;
  const queriesLoading = data.loading.queriesLoading;
  const shouldShowProjectErrorState = !!(data.errors.projectsError && !data.project?.id);
  const shouldShowQueriesErrorState = !!(data.errors.queriesError && data.projectQueries.length === 0);

  useDynamicPageTitle(data.project?.data.title || "Project");

  const { isDraggedQueryInProject, onQueryDrop } = useProjectDetailDragState(data.project);
  const sortSearchState = useSortSearchState();
  const { height, toggle: handleAddNewQueryClick } = useAnimateHeight();
  const { togglePanel, activePanelId } = useSidebar();
  const { openDeleteProjectModal } = useProjectModals();
  const sortedData = useProjectDetailSortedData({
    rawQueries: data.raw.queries,
    projectQueries: data.projectQueries,
    sortField: sortSearchState.sortField,
    sortDirection: sortSearchState.sortDirection,
    searchTerm: sortSearchState.searchTerm,
  });
  const rename = useRenameProject({
    project: data.project,
    allProjects: data.formatted.projects,
    startRenaming: false,
    onRename: () => {},
  });

  const handleRenameClick = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setOptionsOpen(false);
    rename.startRenaming();
  };

  const handleOutsideTabListClick = useCallback(() => {
    setOptionsOpen(false);
  }, []);

  const queryCount = sortedData.sortedQueries.length;
  const queriesTabHeading = `${queriesLoading ? '-' : queryCount} Quer${queryCount === 1 ? 'y' : 'ies'}`;
  const showDropLabel = activePanelId === 'projects' && queryCount > 0 && !queriesLoading;

  return {
    data,
    optionsOpen,
    setOptionsOpen,
    projectsLoading,
    queriesLoading,
    shouldShowProjectErrorState,
    shouldShowQueriesErrorState,
    isDraggedQueryInProject,
    sortSearchState,
    height,
    handleAddNewQueryClick,
    togglePanel,
    openDeleteProjectModal,
    sortedData,
    rename,
    onQueryDrop,
    handleRenameClick,
    handleOutsideTabListClick,
    queriesTabHeading,
    showDropLabel,
    handleRefetch: () => {
      data.refetch.projects();
      data.refetch.queries();
    },
  };
};
