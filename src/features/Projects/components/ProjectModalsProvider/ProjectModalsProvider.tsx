import { FC, ReactNode, createContext, useState, useCallback, useMemo } from 'react';
import { Project, UserQueryObject } from '@/features/Projects/types/projects.d';
import { useModals } from '@/features/Projects/hooks/useModals';
import { useAllDeletePrompts } from '@/features/Projects/hooks/useDeletePrompts';
import ProjectModals from '@/features/Projects/components/ProjectModals/ProjectModals';
import { useProjectSoftDeleteHandlers } from '@/features/Projects/hooks/useProjectModalDeletionHandlers';
import {
  usePermanentDeleteHandlers,
  buildProjectModalDeletionBundle,
} from '@/features/Projects/hooks/usePermanentDeleteHandlers';

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
  const deletePrompts = useAllDeletePrompts();
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const [selectedQueries, setSelectedQueries] = useState<UserQueryObject[]>([]);
  const [sharedQuery, setSharedQuery] = useState<UserQueryObject | null>(null);

  const softDelete = useProjectSoftDeleteHandlers({
    modals,
    deletePrompts,
    selectedProjects,
    setSelectedProjects,
    selectedQueries,
    setSelectedQueries,
  });
  const permanentDelete = usePermanentDeleteHandlers({
    modals,
    deletePrompts,
    selectedProjects,
    setSelectedProjects,
    selectedQueries,
    setSelectedQueries,
  });
  const deletionHandlers = useMemo(
    () => buildProjectModalDeletionBundle(softDelete, permanentDelete),
    [
      softDelete.handleDeleteSelectedProjects,
      softDelete.handleDeleteSelectedQueries,
      softDelete.handleDeleteProject,
      softDelete.handleCancelDeleteProject,
      permanentDelete.handlePermanentDeleteProject,
      permanentDelete.handlePermanentDeleteQuery,
      permanentDelete.handlePermanentDeleteSelected,
      permanentDelete.handleEmptyTrash,
      permanentDelete.handleCancelClosePermanentDeleteProject,
      permanentDelete.handleCancelClosePermanentDeleteQuery,
      permanentDelete.handleCancelClosePermanentDeleteSelected,
      permanentDelete.handleCancelCloseEmptyTrash,
    ],
  );
  const modalVariant = selectedProjects.length === 1 && modals.modals.deleteProject ? 'detail' : 'list';

  const openShareQueryModal = useCallback((query: UserQueryObject) => {
    setSharedQuery(query);
    modals.openModal('shareQuery');
  }, [modals.openModal]);

  const closeModal = useCallback((modalType: string) => {
    modals.closeModal(modalType as keyof typeof modals.modals);
    if (modalType === 'shareQuery') setSharedQuery(null);
  }, [modals.closeModal]);

  const contextValue = useMemo<ProjectModalsContextValue>(() => ({
    openDeleteProjectModal: softDelete.openDeleteProjectModal,
    openDeleteProjectsModal: softDelete.openDeleteProjectsModal,
    openDeleteQueriesModal: softDelete.openDeleteQueriesModal,
    openPermanentDeleteProjectModal: permanentDelete.openPermanentDeleteProjectModal,
    openPermanentDeleteQueryModal: permanentDelete.openPermanentDeleteQueryModal,
    openPermanentDeleteSelectedModal: permanentDelete.openPermanentDeleteSelectedModal,
    openEmptyTrashModal: permanentDelete.openEmptyTrashModal,
    openShareQueryModal,
  }), [
    softDelete.openDeleteProjectModal,
    softDelete.openDeleteProjectsModal,
    softDelete.openDeleteQueriesModal,
    permanentDelete.openPermanentDeleteProjectModal,
    permanentDelete.openPermanentDeleteQueryModal,
    permanentDelete.openPermanentDeleteSelectedModal,
    permanentDelete.openEmptyTrashModal,
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
