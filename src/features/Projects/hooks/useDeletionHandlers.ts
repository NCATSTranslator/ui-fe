import { useCallback, Dispatch, SetStateAction } from 'react';
import { Project, UserQueryObject } from '@/features/Projects/types/projects.d';
import { ModalType } from '@/features/Projects/types/projects.d';

interface UseDeletionHandlersProps {
  projectEditHandlers: {
    handleDeleteProject: (project: Project) => void;
    handlePermanentDeleteProject: (project: Project) => void;
  };
  queryEditHandlers: {
    handleDeleteQuery: (query: UserQueryObject) => void;
    handlePermanentDeleteQuery: (query: UserQueryObject) => void;
  };
  modals: {
    openModal: (modalType: ModalType) => void;
    closeModal: (modalType: ModalType) => void;
  };
  selections: {
    selectedProjects: Project[];
    selectedQueries: UserQueryObject[];
    setSelectedProjects: Dispatch<SetStateAction<Project[]>>;
    setSelectedQueries: Dispatch<SetStateAction<UserQueryObject[]>>;
  };
  prompts: Record<string, { shouldShow: boolean }>;
}

/**
 * Hook to manage deletion handlers for ProjectListInner
 * Consolidates all deletion logic using existing edit handlers and modal management
 * @returns {Object} - An object containing all the deletion handlers
 */
export const useDeletionHandlers = ({
  projectEditHandlers,
  queryEditHandlers,
  modals,
  selections,
  prompts
}: UseDeletionHandlersProps) => {
  const { selectedProjects, selectedQueries, setSelectedProjects, setSelectedQueries } = selections;

  const handleInitiateDeleteSingleProject = useCallback((project: Project) => {
    if (prompts.deleteProjects.shouldShow) {
      setSelectedProjects([project]);
      modals.openModal('deleteProjects');
    } else {
      projectEditHandlers.handleDeleteProject(project);
    }
  }, [projectEditHandlers, prompts.deleteProjects.shouldShow, setSelectedProjects, modals]);

  const handleDeleteSelectedProjects = useCallback(() => {
    selectedProjects.forEach((project: Project) => projectEditHandlers.handleDeleteProject(project));
    modals.closeModal('deleteProjects');
    setSelectedProjects([]);
  }, [selectedProjects, projectEditHandlers, modals, setSelectedProjects]);

  const handleDeleteSelectedQueries = useCallback(() => {
    selectedQueries.forEach((query: UserQueryObject) => queryEditHandlers.handleDeleteQuery(query));
    modals.closeModal('deleteQueries');
    setSelectedQueries([]);
  }, [selectedQueries, queryEditHandlers, modals, setSelectedQueries]);

  const handleInitiateDelete = useCallback(() => {
    if (selectedProjects.length > 0) {
      if (prompts.deleteProjects.shouldShow) {
        modals.openModal('deleteProjects');
      } else {
        handleDeleteSelectedProjects();
      }
    }
    if (selectedQueries.length > 0) {
      if (prompts.deleteQueries.shouldShow) {
        modals.openModal('deleteQueries');
      } else {
        handleDeleteSelectedQueries();
      }
    }
  }, [selectedProjects, selectedQueries, prompts, modals, handleDeleteSelectedProjects, handleDeleteSelectedQueries]);

  const handleInitiatePermanentDeleteSelected = useCallback(() => {
    if (selectedProjects.length > 0 || selectedQueries.length > 0) {
      if (prompts.permanentDeleteSelected.shouldShow) {
        modals.openModal('permanentDeleteSelected');
      } else {
        handlePermanentDeleteSelected();
      }
    }
  }, [selectedProjects, selectedQueries, prompts.permanentDeleteSelected.shouldShow, modals]);

  const handlePermanentDeleteSelected = useCallback(() => {
    modals.closeModal('permanentDeleteSelected');

    if (selectedProjects.length > 0) {
      selectedProjects.forEach((project: Project) => projectEditHandlers.handlePermanentDeleteProject(project));
    }

    if (selectedQueries.length > 0) {
      selectedQueries.forEach((query: UserQueryObject) => queryEditHandlers.handlePermanentDeleteQuery(query));
    }

    setSelectedProjects([]);
    setSelectedQueries([]);
  }, [selectedProjects, selectedQueries, projectEditHandlers, queryEditHandlers, modals, setSelectedProjects, setSelectedQueries]);

  const handleCancelClosePermanentDeleteSelected = useCallback(() => {
    modals.closeModal('permanentDeleteSelected');
    setSelectedProjects([]);
    setSelectedQueries([]);
  }, [modals, setSelectedProjects, setSelectedQueries]);

  const handleInitiateEmptyTrash = useCallback(() => {
    if (prompts.emptyTrash.shouldShow) {
      modals.openModal('emptyTrash');
    } else {
      handleEmptyTrash();
    }
  }, [prompts.emptyTrash.shouldShow, modals]);

  const handleEmptyTrash = useCallback(() => {
    modals.closeModal('emptyTrash');
    // TODO: Add empty trash functionality once BE endpoint is implemented
  }, [modals]);

  const handleCancelCloseEmptyTrash = useCallback(() => {
    modals.closeModal('emptyTrash');
  }, [modals]);

  const handleInitiatePermanentDeleteProject = useCallback((project: Project) => {
    setSelectedProjects([project]);
    if (prompts.permanentDeleteProject.shouldShow) {
      modals.openModal('permanentDeleteProject');
    } else {
      projectEditHandlers.handlePermanentDeleteProject(project);
    }
  }, [setSelectedProjects, prompts.permanentDeleteProject.shouldShow, modals, projectEditHandlers]);

  const handlePermanentDeleteProject = useCallback(() => {
    modals.closeModal('permanentDeleteProject');
    projectEditHandlers.handlePermanentDeleteProject(selectedProjects[0]);
    setSelectedProjects([]);
  }, [modals, projectEditHandlers, selectedProjects, setSelectedProjects]);

  const handleCancelClosePermanentDeleteProject = useCallback(() => {
    modals.closeModal('permanentDeleteProject');
    setSelectedProjects([]);
  }, [modals, setSelectedProjects]);

  const handleInitiatePermanentDeleteQuery = useCallback((query: UserQueryObject) => {
    setSelectedQueries([query]);
    if (prompts.permanentDeleteQuery.shouldShow) {
      modals.openModal('permanentDeleteQuery');
    } else {
      queryEditHandlers.handlePermanentDeleteQuery(query);
    }
  }, [setSelectedQueries, prompts.permanentDeleteQuery.shouldShow, modals, queryEditHandlers]);

  const handlePermanentDeleteQuery = useCallback(() => {
    modals.closeModal('permanentDeleteQuery');
    queryEditHandlers.handlePermanentDeleteQuery(selectedQueries[0]);
    setSelectedQueries([]);
  }, [modals, queryEditHandlers, selectedQueries, setSelectedQueries]);

  const handleCancelClosePermanentDeleteQuery = useCallback(() => {
    modals.closeModal('permanentDeleteQuery');
    setSelectedQueries([]);
  }, [modals, setSelectedQueries]);

  return {
    handleInitiateDeleteSingleProject,
    handleDeleteSelectedProjects,
    handleDeleteSelectedQueries,
    handleInitiateDelete,
    handleInitiatePermanentDeleteSelected,
    handlePermanentDeleteSelected,
    handleCancelClosePermanentDeleteSelected,
    handleInitiateEmptyTrash,
    handleEmptyTrash,
    handleCancelCloseEmptyTrash,
    handleInitiatePermanentDeleteProject,
    handlePermanentDeleteProject,
    handleCancelClosePermanentDeleteProject,
    handleInitiatePermanentDeleteQuery,
    handlePermanentDeleteQuery,
    handleCancelClosePermanentDeleteQuery
  };
};
