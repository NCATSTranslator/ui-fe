import { useCallback, Dispatch, SetStateAction } from 'react';
import { Project, UserQueryObject } from '@/features/Projects/types/projects.d';
import type { useModals } from '@/features/Projects/hooks/useModals';
import type { useAllDeletePrompts } from '@/features/Projects/hooks/useDeletePrompts';

type ModalsApi = ReturnType<typeof useModals>;
type DeletePrompts = ReturnType<typeof useAllDeletePrompts>;

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

const usePermanentDeleteModalOpeners = ({
  openModal,
  deletePrompts,
  setSelectedProjects,
  setSelectedQueries,
  handlePermanentDeleteProjectInternal,
  handlePermanentDeleteQueryInternal,
  handlePermanentDeleteSelectedInternal,
}: {
  openModal: ModalsApi['openModal'];
  deletePrompts: DeletePrompts;
  setSelectedProjects: PermanentDeleteState['setSelectedProjects'];
  setSelectedQueries: PermanentDeleteState['setSelectedQueries'];
  handlePermanentDeleteProjectInternal: (project: Project) => void;
  handlePermanentDeleteQueryInternal: (query: UserQueryObject) => void;
  handlePermanentDeleteSelectedInternal: (projects: Project[], queries: UserQueryObject[]) => void;
}) => {
  const openPermanentDeleteProjectModal = useCallback((project: Project) => {
    setSelectedProjects([project]);
    if (deletePrompts.permanentDeleteProject.shouldShow) openModal('permanentDeleteProject');
    else handlePermanentDeleteProjectInternal(project);
  }, [
    deletePrompts.permanentDeleteProject.shouldShow,
    handlePermanentDeleteProjectInternal,
    openModal,
    setSelectedProjects,
  ]);

  const openPermanentDeleteQueryModal = useCallback((query: UserQueryObject) => {
    setSelectedQueries([query]);
    if (deletePrompts.permanentDeleteQuery.shouldShow) openModal('permanentDeleteQuery');
    else handlePermanentDeleteQueryInternal(query);
  }, [
    deletePrompts.permanentDeleteQuery.shouldShow,
    handlePermanentDeleteQueryInternal,
    openModal,
    setSelectedQueries,
  ]);

  const openPermanentDeleteSelectedModal = useCallback((projects: Project[], queries: UserQueryObject[]) => {
    setSelectedProjects(projects);
    setSelectedQueries(queries);
    if (deletePrompts.permanentDeleteSelected.shouldShow) openModal('permanentDeleteSelected');
    else handlePermanentDeleteSelectedInternal(projects, queries);
  }, [
    deletePrompts.permanentDeleteSelected.shouldShow,
    handlePermanentDeleteSelectedInternal,
    openModal,
    setSelectedProjects,
    setSelectedQueries,
  ]);

  return { openPermanentDeleteProjectModal, openPermanentDeleteQueryModal, openPermanentDeleteSelectedModal };
};

export const usePermanentDeleteHandlers = ({
  modals,
  deletePrompts,
  selectedProjects,
  setSelectedProjects,
  selectedQueries,
  setSelectedQueries,
}: PermanentDeleteState) => {
  const { openModal, closeModal } = modals;
  const emptyTrash = useEmptyTrashHandlers(openModal, closeModal, deletePrompts);
  const {
    closeAndClearProjects,
    handlePermanentDeleteProjectInternal,
    handlePermanentDeleteQueryInternal,
    handlePermanentDeleteSelectedInternal,
  } = usePermanentDeleteInternals({
    closeModal,
    setSelectedProjects,
    setSelectedQueries,
  });
  const modalOpeners = usePermanentDeleteModalOpeners({
    openModal,
    deletePrompts,
    setSelectedProjects,
    setSelectedQueries,
    handlePermanentDeleteProjectInternal,
    handlePermanentDeleteQueryInternal,
    handlePermanentDeleteSelectedInternal,
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

  const handleCancelClosePermanentDeleteProject = useCallback(() => {
    closeAndClearProjects('permanentDeleteProject');
  }, [closeAndClearProjects]);

  const handleCancelClosePermanentDeleteQuery = useCallback(() => {
    closeModal('permanentDeleteQuery');
    setSelectedQueries([]);
  }, [closeModal, setSelectedQueries]);

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
    ...modalOpeners,
  };
};
