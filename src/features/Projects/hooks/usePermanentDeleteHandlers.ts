import { useCallback, Dispatch, SetStateAction } from 'react';
import { Project, UserQueryObject } from '@/features/Projects/types/projects.d';
import type { useModals } from '@/features/Projects/hooks/useModals';
import type { useAllDeletePrompts } from '@/features/Projects/hooks/useDeletePrompts';

type ModalsApi = ReturnType<typeof useModals>;
type DeletePrompts = ReturnType<typeof useAllDeletePrompts>;

type SoftDeleteHandlers = {
  handleDeleteSelectedProjects: () => void;
  handleDeleteSelectedQueries: () => void;
  handleDeleteProject: () => void;
  handleCancelDeleteProject: () => void;
};

interface PermanentDeleteState {
  modals: ModalsApi;
  deletePrompts: DeletePrompts;
  selectedProjects: Project[];
  setSelectedProjects: Dispatch<SetStateAction<Project[]>>;
  selectedQueries: UserQueryObject[];
  setSelectedQueries: Dispatch<SetStateAction<UserQueryObject[]>>;
}

const useEmptyTrashHandlers = (
  openModal: ModalsApi['openModal'],
  closeModal: ModalsApi['closeModal'],
  deletePrompts: DeletePrompts,
) => {
  const openEmptyTrashModal = useCallback(() => {
    if (deletePrompts.emptyTrash.shouldShow) openModal('emptyTrash');
    else console.log('Empty trash');
  }, [deletePrompts.emptyTrash.shouldShow, openModal]);

  const handleEmptyTrash = useCallback(() => {
    console.log('Empty trash confirmed');
    closeModal('emptyTrash');
  }, [closeModal]);

  const handleCancelCloseEmptyTrash = useCallback(() => {
    closeModal('emptyTrash');
  }, [closeModal]);

  return { openEmptyTrashModal, handleEmptyTrash, handleCancelCloseEmptyTrash };
};

const usePermanentDeleteInternals = ({
  closeModal,
  setSelectedProjects,
  setSelectedQueries,
}: {
  closeModal: ModalsApi['closeModal'];
  setSelectedProjects: PermanentDeleteState['setSelectedProjects'];
  setSelectedQueries: PermanentDeleteState['setSelectedQueries'];
}) => {
  const closeAndClearProjects = useCallback((modal: 'permanentDeleteProject' | 'permanentDeleteSelected') => {
    closeModal(modal);
    setSelectedProjects([]);
    if (modal === 'permanentDeleteSelected') setSelectedQueries([]);
  }, [closeModal, setSelectedProjects, setSelectedQueries]);

  const handlePermanentDeleteProjectInternal = useCallback((project: Project) => {
    console.log('Permanent delete project confirmed', project);
    closeAndClearProjects('permanentDeleteProject');
  }, [closeAndClearProjects]);

  const handlePermanentDeleteQueryInternal = useCallback((query: UserQueryObject) => {
    console.log('Permanent delete query confirmed', query);
    closeModal('permanentDeleteQuery');
    setSelectedQueries([]);
  }, [closeModal, setSelectedQueries]);

  const handlePermanentDeleteSelectedInternal = useCallback((
    projects: Project[],
    queries: UserQueryObject[],
  ) => {
    console.log('Permanent delete selected confirmed', projects, queries);
    closeAndClearProjects('permanentDeleteSelected');
  }, [closeAndClearProjects]);

  return {
    closeAndClearProjects,
    handlePermanentDeleteProjectInternal,
    handlePermanentDeleteQueryInternal,
    handlePermanentDeleteSelectedInternal,
  };
};

export const usePermanentDeleteHandlers = ({
  modals,
  deletePrompts,
  selectedProjects,
  setSelectedProjects,
  selectedQueries,
  setSelectedQueries,
}: PermanentDeleteState) => {
  const emptyTrash = useEmptyTrashHandlers(modals.openModal, modals.closeModal, deletePrompts);
  const {
    closeAndClearProjects,
    handlePermanentDeleteProjectInternal,
    handlePermanentDeleteQueryInternal,
    handlePermanentDeleteSelectedInternal,
  } = usePermanentDeleteInternals({
    closeModal: modals.closeModal,
    setSelectedProjects,
    setSelectedQueries,
  });

  const handlePermanentDeleteProject = useCallback(() => {
    if (selectedProjects[0]) handlePermanentDeleteProjectInternal(selectedProjects[0]);
  }, [handlePermanentDeleteProjectInternal, selectedProjects]);

  const handlePermanentDeleteQuery = useCallback(() => {
    if (selectedQueries[0]) handlePermanentDeleteQueryInternal(selectedQueries[0]);
  }, [handlePermanentDeleteQueryInternal, selectedQueries]);

  const handlePermanentDeleteSelected = useCallback(() => {
    if (selectedProjects.length > 0 || selectedQueries.length > 0) {
      handlePermanentDeleteSelectedInternal(selectedProjects, selectedQueries);
    }
  }, [handlePermanentDeleteSelectedInternal, selectedProjects, selectedQueries]);

  const openPermanentDeleteProjectModal = useCallback((project: Project) => {
    setSelectedProjects([project]);
    if (deletePrompts.permanentDeleteProject.shouldShow) modals.openModal('permanentDeleteProject');
    else handlePermanentDeleteProjectInternal(project);
  }, [
    deletePrompts.permanentDeleteProject.shouldShow,
    handlePermanentDeleteProjectInternal,
    modals.openModal,
    setSelectedProjects,
  ]);

  const openPermanentDeleteQueryModal = useCallback((query: UserQueryObject) => {
    setSelectedQueries([query]);
    if (deletePrompts.permanentDeleteQuery.shouldShow) modals.openModal('permanentDeleteQuery');
    else handlePermanentDeleteQueryInternal(query);
  }, [
    deletePrompts.permanentDeleteQuery.shouldShow,
    handlePermanentDeleteQueryInternal,
    modals.openModal,
    setSelectedQueries,
  ]);

  const openPermanentDeleteSelectedModal = useCallback((projects: Project[], queries: UserQueryObject[]) => {
    setSelectedProjects(projects);
    setSelectedQueries(queries);
    if (deletePrompts.permanentDeleteSelected.shouldShow) modals.openModal('permanentDeleteSelected');
    else handlePermanentDeleteSelectedInternal(projects, queries);
  }, [
    deletePrompts.permanentDeleteSelected.shouldShow,
    handlePermanentDeleteSelectedInternal,
    modals.openModal,
    setSelectedProjects,
    setSelectedQueries,
  ]);

  const handleCancelClosePermanentDeleteProject = useCallback(() => {
    closeAndClearProjects('permanentDeleteProject');
  }, [closeAndClearProjects]);

  const handleCancelClosePermanentDeleteQuery = useCallback(() => {
    modals.closeModal('permanentDeleteQuery');
    setSelectedQueries([]);
  }, [modals.closeModal, setSelectedQueries]);

  const handleCancelClosePermanentDeleteSelected = useCallback(() => {
    closeAndClearProjects('permanentDeleteSelected');
  }, [closeAndClearProjects]);

  return {
    handlePermanentDeleteProject,
    handlePermanentDeleteQuery,
    handlePermanentDeleteSelected,
    ...emptyTrash,
    handleCancelClosePermanentDeleteProject,
    handleCancelClosePermanentDeleteQuery,
    handleCancelClosePermanentDeleteSelected,
    openPermanentDeleteProjectModal,
    openPermanentDeleteQueryModal,
    openPermanentDeleteSelectedModal,
  };
};

export const buildProjectModalDeletionBundle = (
  soft: SoftDeleteHandlers,
  permanent: ReturnType<typeof usePermanentDeleteHandlers>,
) => ({
  handleDeleteSelectedProjects: soft.handleDeleteSelectedProjects,
  handleDeleteSelectedQueries: soft.handleDeleteSelectedQueries,
  handlePermanentDeleteProject: permanent.handlePermanentDeleteProject,
  handlePermanentDeleteQuery: permanent.handlePermanentDeleteQuery,
  handlePermanentDeleteSelected: permanent.handlePermanentDeleteSelected,
  handleEmptyTrash: permanent.handleEmptyTrash,
  handleCancelClosePermanentDeleteProject: permanent.handleCancelClosePermanentDeleteProject,
  handleCancelClosePermanentDeleteQuery: permanent.handleCancelClosePermanentDeleteQuery,
  handleCancelClosePermanentDeleteSelected: permanent.handleCancelClosePermanentDeleteSelected,
  handleCancelCloseEmptyTrash: permanent.handleCancelCloseEmptyTrash,
  handleDeleteProject: soft.handleDeleteProject,
  handleCancelDeleteProject: soft.handleCancelDeleteProject,
});
