import { FC, ReactNode, createContext, useState, useCallback, useMemo } from 'react';
import { ModalType, Project, UserQueryObject } from '@/features/Projects/types/projects.d';
import { useModals } from '@/features/Projects/hooks/useModals';
import { useAllDeletePrompts } from '@/features/Projects/hooks/useDeletePrompts';
import ProjectModals from '@/features/Projects/components/ProjectModals/ProjectModals';
import { useProjectSoftDeleteHandlers } from '@/features/Projects/hooks/useProjectModalDeletionHandlers';
import { usePermanentDeleteHandlers } from '@/features/Projects/hooks/usePermanentDeleteHandlers';

interface ProjectModalsContextValue {
  openDeleteProjectModal: (project: Project) => void;
  openDeleteProjectsModal: (projects: Project[]) => void;
  openDeleteQueriesModal: (queries: UserQueryObject[]) => void;
  openPermanentDeleteProjectModal: (project: Project) => void;
  openPermanentDeleteQueryModal: (query: UserQueryObject) => void;
  openPermanentDeleteSelectedModal: (projects: Project[], queries: UserQueryObject[]) => void;
  openEmptyTrashModal: () => void;
  openShareQueryModal: (query: UserQueryObject) => void;
}

export const ProjectModalsContext = createContext<ProjectModalsContextValue | undefined>(undefined);

interface ProjectModalsProviderProps {
  children: ReactNode;
}

export const ProjectModalsProvider: FC<ProjectModalsProviderProps> = ({ children }) => {
  const modals = useModals({
    deleteProjects: false,
    deleteProject: false,
    deleteQueries: false,
    permanentDeleteProject: false,
    permanentDeleteQuery: false,
    permanentDeleteSelected: false,
    emptyTrash: false,
    shareQuery: false,
  });
  const { openModal, closeModal: closeModalByType } = modals;
  const deletePrompts = useAllDeletePrompts();
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const [selectedQueries, setSelectedQueries] = useState<UserQueryObject[]>([]);
  const [sharedQuery, setSharedQuery] = useState<UserQueryObject | null>(null);

  const {
    handleDeleteSelectedProjects,
    handleDeleteSelectedQueries,
    handleDeleteProject,
    handleCancelDeleteProject,
    openDeleteProjectModal,
    openDeleteProjectsModal,
    openDeleteQueriesModal,
  } = useProjectSoftDeleteHandlers({
    modals,
    deletePrompts,
    selectedProjects,
    setSelectedProjects,
    selectedQueries,
    setSelectedQueries,
  });
  const {
    handlePermanentDeleteProject,
    handlePermanentDeleteQuery,
    handlePermanentDeleteSelected,
    handleEmptyTrash,
    handleCancelClosePermanentDeleteProject,
    handleCancelClosePermanentDeleteQuery,
    handleCancelClosePermanentDeleteSelected,
    handleCancelCloseEmptyTrash,
    openPermanentDeleteProjectModal,
    openPermanentDeleteQueryModal,
    openPermanentDeleteSelectedModal,
    openEmptyTrashModal,
  } = usePermanentDeleteHandlers({
    modals,
    deletePrompts,
    selectedProjects,
    setSelectedProjects,
    selectedQueries,
    setSelectedQueries,
  });
  const deletionHandlers = useMemo(() => ({
    handleDeleteSelectedProjects,
    handleDeleteSelectedQueries,
    handlePermanentDeleteProject,
    handlePermanentDeleteQuery,
    handlePermanentDeleteSelected,
    handleEmptyTrash,
    handleCancelClosePermanentDeleteProject,
    handleCancelClosePermanentDeleteQuery,
    handleCancelClosePermanentDeleteSelected,
    handleCancelCloseEmptyTrash,
    handleDeleteProject,
    handleCancelDeleteProject,
  }), [
    handleDeleteSelectedProjects,
    handleDeleteSelectedQueries,
    handlePermanentDeleteProject,
    handlePermanentDeleteQuery,
    handlePermanentDeleteSelected,
    handleEmptyTrash,
    handleCancelClosePermanentDeleteProject,
    handleCancelClosePermanentDeleteQuery,
    handleCancelClosePermanentDeleteSelected,
    handleCancelCloseEmptyTrash,
    handleDeleteProject,
    handleCancelDeleteProject,
  ]);
  const modalVariant = selectedProjects.length === 1 && modals.modals.deleteProject ? 'detail' : 'list';

  const openShareQueryModal = useCallback((query: UserQueryObject) => {
    setSharedQuery(query);
    openModal('shareQuery');
  }, [openModal]);

  const closeModal = useCallback((modalType: string) => {
    closeModalByType(modalType as ModalType);
    if (modalType === 'shareQuery') setSharedQuery(null);
  }, [closeModalByType]);

  const contextValue = useMemo<ProjectModalsContextValue>(() => ({
    openDeleteProjectModal,
    openDeleteProjectsModal,
    openDeleteQueriesModal,
    openPermanentDeleteProjectModal,
    openPermanentDeleteQueryModal,
    openPermanentDeleteSelectedModal,
    openEmptyTrashModal,
    openShareQueryModal,
  }), [
    openDeleteProjectModal,
    openDeleteProjectsModal,
    openDeleteQueriesModal,
    openPermanentDeleteProjectModal,
    openPermanentDeleteQueryModal,
    openPermanentDeleteSelectedModal,
    openEmptyTrashModal,
    openShareQueryModal,
  ]);

  return (
    <ProjectModalsContext.Provider value={contextValue}>
      {children}
      <ProjectModals
        modals={modals.modals}
        selectedProjects={selectedProjects}
        selectedQueries={selectedQueries}
        onCloseModal={closeModal}
        setSelectedProjects={setSelectedProjects}
        deletionHandlers={deletionHandlers}
        deletePrompts={deletePrompts}
        currentProject={selectedProjects[0]}
        variant={modalVariant}
        shareQueryModal={sharedQuery ? {
          sharedQuery,
          onClose: () => {
            setSharedQuery(null);
            closeModal('shareQuery');
          },
        } : undefined}
      />
    </ProjectModalsContext.Provider>
  );
};
