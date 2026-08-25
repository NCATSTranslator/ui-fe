import { useCallback, Dispatch, SetStateAction } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { Project, UserQueryObject } from '@/features/Projects/types/projects.d';
import { useDeleteProjects, useDeleteQueries } from '@/features/Projects/hooks/customHooks';
import { projectDeletedToast, queryDeletedToast, errorToast } from '@/features/Core/utils/toastMessages';
import { useSidebar } from '@/features/Sidebar/hooks/sidebarHooks';
import { getDataFromQueryVar } from '@/features/Core/utils/urlHelpers';
import {
  setProjectsDeletedFlag,
  setQueriesDeletedFlag,
} from '@/features/Projects/utils/projectQueryCacheHelpers';
import type { useModals } from '@/features/Projects/hooks/useModals';
import type { useAllDeletePrompts } from '@/features/Projects/hooks/useDeletePrompts';

export type ModalsApi = ReturnType<typeof useModals>;
export type DeletePrompts = ReturnType<typeof useAllDeletePrompts>;

interface SoftDeleteState {
  modals: ModalsApi;
  deletePrompts: DeletePrompts;
  selectedProjects: Project[];
  setSelectedProjects: Dispatch<SetStateAction<Project[]>>;
  selectedQueries: UserQueryObject[];
  setSelectedQueries: Dispatch<SetStateAction<UserQueryObject[]>>;
}

const useSoftDeleteMutations = ({
  closeModal,
  selectedProject,
  clearSelectedProject,
  setSelectedProjects,
  setSelectedQueries,
}: {
  closeModal: ModalsApi['closeModal'];
  selectedProject: ReturnType<typeof useSidebar>['selectedProject'];
  clearSelectedProject: () => void;
  setSelectedProjects: Dispatch<SetStateAction<Project[]>>;
  setSelectedQueries: Dispatch<SetStateAction<UserQueryObject[]>>;
}) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const deleteProjectsMutation = useDeleteProjects();
  const deleteQueriesMutation = useDeleteQueries();

  const handleDeleteProjectInternal = useCallback((project: Project) => {
    setProjectsDeletedFlag(queryClient, [project.id], true);
    deleteProjectsMutation.mutate([project.id.toString()], {
      onSuccess: () => {
        projectDeletedToast();
        closeModal('deleteProject');
        setSelectedProjects([]);
        if (selectedProject?.id === project.id) clearSelectedProject();
      },
      onError: () => {
        setProjectsDeletedFlag(queryClient, [project.id], false);
        errorToast('Failed to delete project');
      },
    });
  }, [
    clearSelectedProject,
    closeModal,
    deleteProjectsMutation,
    queryClient,
    selectedProject,
    setSelectedProjects,
  ]);

  const handleDeleteProjectsInternal = useCallback((projects: Project[]) => {
    const projectIds = projects.map(p => p.id);
    setProjectsDeletedFlag(queryClient, projectIds, true);
    deleteProjectsMutation.mutate(
      projectIds.map(id => id.toString()),
      {
        onSuccess: () => {
          projectDeletedToast();
          closeModal('deleteProjects');
          setSelectedProjects([]);
        },
        onError: () => {
          setProjectsDeletedFlag(queryClient, projectIds, false);
          errorToast('Failed to delete projects');
        },
      },
    );
  }, [closeModal, deleteProjectsMutation, queryClient, setSelectedProjects]);

  const handleDeleteQueriesInternal = useCallback((queries: UserQueryObject[]) => {
    const querySids = queries.map(q => q.sid);
    setQueriesDeletedFlag(queryClient, querySids, true);
    deleteQueriesMutation.mutate(
      querySids,
      {
        onSuccess: () => {
          queryDeletedToast();
          closeModal('deleteQueries');
          const currentQid = getDataFromQueryVar('q', location.search);
          if (currentQid && queries.some(q => q.data.qid === currentQid)) {
            navigate('/query-history', { replace: true });
          }
          setSelectedQueries([]);
        },
        onError: () => {
          setQueriesDeletedFlag(queryClient, querySids, false);
          errorToast('Failed to delete queries');
        },
      },
    );
  }, [closeModal, deleteQueriesMutation, location.search, navigate, queryClient, setSelectedQueries]);

  return { handleDeleteProjectInternal, handleDeleteProjectsInternal, handleDeleteQueriesInternal };
};

export const useProjectSoftDeleteHandlers = ({
  modals,
  deletePrompts,
  selectedProjects,
  setSelectedProjects,
  selectedQueries,
  setSelectedQueries,
}: SoftDeleteState) => {
  const { selectedProject, clearSelectedProject } = useSidebar();
  const {
    handleDeleteProjectInternal,
    handleDeleteProjectsInternal,
    handleDeleteQueriesInternal,
  } = useSoftDeleteMutations({
    closeModal: modals.closeModal,
    selectedProject,
    clearSelectedProject,
    setSelectedProjects,
    setSelectedQueries,
  });

  const handleDeleteProject = useCallback(() => {
    if (selectedProjects[0]) handleDeleteProjectInternal(selectedProjects[0]);
  }, [handleDeleteProjectInternal, selectedProjects]);

  const handleDeleteSelectedProjects = useCallback(() => {
    if (selectedProjects.length > 0) handleDeleteProjectsInternal(selectedProjects);
  }, [handleDeleteProjectsInternal, selectedProjects]);

  const handleDeleteSelectedQueries = useCallback(() => {
    if (selectedQueries.length > 0) handleDeleteQueriesInternal(selectedQueries);
  }, [handleDeleteQueriesInternal, selectedQueries]);

  const openDeleteProjectModal = useCallback((project: Project) => {
    setSelectedProjects([project]);
    if (deletePrompts.deleteProjects.shouldShow) modals.openModal('deleteProject');
    else handleDeleteProjectInternal(project);
  }, [
    deletePrompts.deleteProjects.shouldShow,
    handleDeleteProjectInternal,
    modals.openModal,
    setSelectedProjects,
  ]);

  const openDeleteProjectsModal = useCallback((projects: Project[]) => {
    setSelectedProjects(projects);
    if (deletePrompts.deleteProjects.shouldShow) modals.openModal('deleteProjects');
    else handleDeleteProjectsInternal(projects);
  }, [
    deletePrompts.deleteProjects.shouldShow,
    handleDeleteProjectsInternal,
    modals.openModal,
    setSelectedProjects,
  ]);

  const openDeleteQueriesModal = useCallback((queries: UserQueryObject[]) => {
    setSelectedQueries(queries);
    if (deletePrompts.deleteQueries.shouldShow) modals.openModal('deleteQueries');
    else handleDeleteQueriesInternal(queries);
  }, [
    deletePrompts.deleteQueries.shouldShow,
    handleDeleteQueriesInternal,
    modals.openModal,
    setSelectedQueries,
  ]);

  const handleCancelDeleteProject = useCallback(() => {
    modals.closeModal('deleteProject');
    setSelectedProjects([]);
  }, [modals.closeModal, setSelectedProjects]);

  return {
    handleDeleteProject,
    handleDeleteSelectedProjects,
    handleDeleteSelectedQueries,
    handleCancelDeleteProject,
    openDeleteProjectModal,
    openDeleteProjectsModal,
    openDeleteQueriesModal,
  };
};
