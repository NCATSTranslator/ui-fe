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

const useSoftDeleteProjectMutations = ({
  closeModal,
  selectedProject,
  clearSelectedProject,
  setSelectedProjects,
}: {
  closeModal: ModalsApi['closeModal'];
  selectedProject: ReturnType<typeof useSidebar>['selectedProject'];
  clearSelectedProject: () => void;
  setSelectedProjects: Dispatch<SetStateAction<Project[]>>;
}) => {
  const queryClient = useQueryClient();
  const deleteProjectsMutation = useDeleteProjects();

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

  return { handleDeleteProjectInternal, handleDeleteProjectsInternal };
};

const useSoftDeleteQueriesMutation = ({
  closeModal,
  setSelectedQueries,
}: {
  closeModal: ModalsApi['closeModal'];
  setSelectedQueries: Dispatch<SetStateAction<UserQueryObject[]>>;
}) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const deleteQueriesMutation = useDeleteQueries();

  return useCallback((queries: UserQueryObject[]) => {
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
};

export const useProjectSoftDeleteHandlers = ({
  modals,
  deletePrompts,
  selectedProjects,
  setSelectedProjects,
  selectedQueries,
  setSelectedQueries,
}: SoftDeleteState) => {
  const { openModal, closeModal } = modals;
  const { selectedProject, clearSelectedProject } = useSidebar();
  const {
    handleDeleteProjectInternal,
    handleDeleteProjectsInternal,
  } = useSoftDeleteProjectMutations({
    closeModal,
    selectedProject,
    clearSelectedProject,
    setSelectedProjects,
  });
  const handleDeleteQueriesInternal = useSoftDeleteQueriesMutation({ closeModal, setSelectedQueries });

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
    if (deletePrompts.deleteProjects.shouldShow) openModal('deleteProject');
    else handleDeleteProjectInternal(project);
  }, [
    deletePrompts.deleteProjects.shouldShow,
    handleDeleteProjectInternal,
    openModal,
    setSelectedProjects,
  ]);

  const openDeleteProjectsModal = useCallback((projects: Project[]) => {
    setSelectedProjects(projects);
    if (deletePrompts.deleteProjects.shouldShow) openModal('deleteProjects');
    else handleDeleteProjectsInternal(projects);
  }, [
    deletePrompts.deleteProjects.shouldShow,
    handleDeleteProjectsInternal,
    openModal,
    setSelectedProjects,
  ]);

  const openDeleteQueriesModal = useCallback((queries: UserQueryObject[]) => {
    setSelectedQueries(queries);
    if (deletePrompts.deleteQueries.shouldShow) openModal('deleteQueries');
    else handleDeleteQueriesInternal(queries);
  }, [
    deletePrompts.deleteQueries.shouldShow,
    handleDeleteQueriesInternal,
    openModal,
    setSelectedQueries,
  ]);

  const handleCancelDeleteProject = useCallback(() => {
    closeModal('deleteProject');
    setSelectedProjects([]);
  }, [closeModal, setSelectedProjects]);

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
