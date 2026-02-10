import { Dispatch, SetStateAction, useCallback } from 'react';
import { ModalType, Project, UserQueryObject } from '@/features/Projects/types/projects.d';

interface UseProjectDetailDeletionHandlersProps {
  projectEditHandlers: {
    handleDeleteProject: (project: Project) => void;
  };
  queryEditHandlers: {
    handleDeleteQuery: (query: UserQueryObject) => void;
  };
  modals: {
    openModal: (modalType: ModalType) => void;
    closeModal: (modalType: ModalType) => void;
  };
  prompts: Record<string, { shouldShow: boolean }>;
  selectedQueries: UserQueryObject[];
  setSelectedQueries: Dispatch<SetStateAction<UserQueryObject[]>>;
}

/**
 * Hook to manage deletion handlers for ProjectDetailInner
 * Consolidates deletion logic following the pattern from useDeletionHandlers
 * @returns {Object} - An object containing deletion handlers
 */
export const useProjectDetailDeletionHandlers = ({
  projectEditHandlers,
  queryEditHandlers,
  modals,
  prompts,
  selectedQueries,
  setSelectedQueries
}: UseProjectDetailDeletionHandlersProps) => {

  const handleInitiateDeleteProject = useCallback((project: Project) => {
    if (prompts.deleteProjects.shouldShow) {
      modals.openModal('deleteProject');
    } else {
      projectEditHandlers.handleDeleteProject(project);
    }
  }, [projectEditHandlers, prompts.deleteProjects.shouldShow, modals]);

  const handleDeleteProject = useCallback((project: Project) => {
    projectEditHandlers.handleDeleteProject(project);
    modals.closeModal('deleteProject');
  }, [projectEditHandlers, modals]);

  const handleCancelDeleteProject = useCallback(() => {
    modals.closeModal('deleteProject');
  }, [modals]);

  const handleDeleteSelectedQueries = useCallback(() => {
    selectedQueries.forEach((query: UserQueryObject) => queryEditHandlers.handleDeleteQuery(query));
    modals.closeModal('deleteQueries');
    setSelectedQueries([]);
  }, [selectedQueries, queryEditHandlers, modals, setSelectedQueries]);

  const handleInitiateDeleteSelectedQueries = useCallback(() => {
    console.log('handleInitiateDeleteSelectedQueries', selectedQueries);
    if (selectedQueries.length > 0) {
      if (prompts.deleteQueries.shouldShow) {
        modals.openModal('deleteQueries');
      } else {
        handleDeleteSelectedQueries();
      }
    }
  }, [selectedQueries, prompts.deleteQueries.shouldShow, modals]);

  return {
    handleInitiateDeleteProject,
    handleDeleteProject,
    handleCancelDeleteProject,
    handleInitiateDeleteSelectedQueries,
    handleDeleteSelectedQueries
  };
};
