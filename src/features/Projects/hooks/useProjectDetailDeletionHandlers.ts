import { useCallback } from 'react';
import { Project } from '@/features/Projects/types/projects.d';

interface UseProjectDetailDeletionHandlersProps {
  projectEditHandlers: {
    handleDeleteProject: (project: Project) => void;
  };
  modals: {
    openModal: (modalType: any) => void;
    closeModal: (modalType: any) => void;
  };
  prompts: Record<string, { shouldShow: boolean }>;
}

/**
 * Hook to manage deletion handlers for ProjectDetailInner
 * Consolidates deletion logic following the pattern from useDeletionHandlers
 * @returns {Object} - An object containing deletion handlers
 */
export const useProjectDetailDeletionHandlers = ({
  projectEditHandlers,
  modals,
  prompts
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

  return {
    handleInitiateDeleteProject,
    handleDeleteProject,
    handleCancelDeleteProject
  };
};
