import { FC, ReactNode, createContext, useState, useCallback, useMemo } from 'react';
import { Project, UserQueryObject, QueryEditingItem, ProjectRaw } from '@/features/Projects/types/projects.d';
import { useModals } from '@/features/Projects/hooks/useModals';
import { useAllDeletePrompts } from '@/features/Projects/hooks/useDeletePrompts';
import { useDeleteProjects, useDeleteQueries } from '@/features/Projects/hooks/customHooks';
import ProjectModals from '@/features/Projects/components/ProjectModals/ProjectModals';
import { projectDeletedToast, queryDeletedToast, errorToast } from '@/features/Core/utils/toastMessages';
import { useSidebar } from '@/features/Sidebar/hooks/sidebarHooks';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDataFromQueryVar } from '@/features/Common/utils/utilities';

interface EditQueryModalData {
  currentEditingQueryItem?: QueryEditingItem;
  handleClose?: () => void;
  isOpen: boolean;
  loading: boolean;
  mode: 'edit' | 'add';
  projects: ProjectRaw[];
  queries: UserQueryObject[];
  setSelectedProject?: (project: ProjectRaw) => void;
}

interface ProjectModalsContextValue {
  // Simple modal triggers - just pass data, provider handles everything
  openDeleteProjectModal: (project: Project) => void;
  openDeleteProjectsModal: (projects: Project[]) => void;
  openDeleteQueriesModal: (queries: UserQueryObject[]) => void;
  openPermanentDeleteProjectModal: (project: Project) => void;
  openPermanentDeleteQueryModal: (query: UserQueryObject) => void;
  openPermanentDeleteSelectedModal: (projects: Project[], queries: UserQueryObject[]) => void;
  openEmptyTrashModal: () => void;
  openEditQueryModal: (data: EditQueryModalData) => void;
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
    shareQuery: false
  });

  const deletePrompts = useAllDeletePrompts();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Mutation hooks
  const deleteProjectsMutation = useDeleteProjects();
  const deleteQueriesMutation = useDeleteQueries();
  
  // Modal data state
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const [selectedQueries, setSelectedQueries] = useState<UserQueryObject[]>([]);
  const [sharedQuery, setSharedQuery] = useState<UserQueryObject | null>(null);
  const [editQueryModalData, setEditQueryModalData] = useState<EditQueryModalData | null>(null);

  const { selectedProject, clearSelectedProject } = useSidebar();
  
  // Determine variant based on context
  const modalVariant = selectedProjects.length === 1 && modals.modals.deleteProject ? 'detail' : 'list';
  
  // ==================== DELETE PROJECT HANDLERS ====================

  // Internal handler with parameter for direct deletion
  const handleDeleteProjectInternal = useCallback((project: Project) => {
    deleteProjectsMutation.mutate([project.id.toString()], {
      onSuccess: () => {
        projectDeletedToast();
        modals.closeModal('deleteProject');
        setSelectedProjects([]);
        if(selectedProject?.id === project.id) {
          clearSelectedProject();
        }
      },
      onError: () => errorToast('Failed to delete project')
    });
  }, [deleteProjectsMutation, modals, location.search, clearSelectedProject, selectedProject]);

  // Internal handler with parameter for direct deletion
  const handleDeleteProjectsInternal = useCallback((projects: Project[]) => {
    deleteProjectsMutation.mutate(
      projects.map(p => p.id.toString()),
      {
        onSuccess: () => {
          projectDeletedToast();
          modals.closeModal('deleteProjects');
          setSelectedProjects([]);
        },
        onError: () => errorToast('Failed to delete projects')
      }
    );
  }, [deleteProjectsMutation, modals]);

  // Modal handler (no params - reads from state)
  const handleDeleteProject = useCallback(() => {
    if (selectedProjects[0]) {
      handleDeleteProjectInternal(selectedProjects[0]);
    }
  }, [handleDeleteProjectInternal, selectedProjects]);

  // Modal handler (no params - reads from state)
  const handleDeleteSelectedProjects = useCallback(() => {
    if (selectedProjects.length > 0) {
      handleDeleteProjectsInternal(selectedProjects);
    }
  }, [handleDeleteProjectsInternal, selectedProjects]);
  
  const openDeleteProjectModal = useCallback((project: Project) => {
    setSelectedProjects([project]);
    if (deletePrompts.deleteProjects.shouldShow) {
      modals.openModal('deleteProject');
    } else {
      // Delete immediately without prompt - use internal handler
      handleDeleteProjectInternal(project);
    }
  }, [deletePrompts.deleteProjects.shouldShow, modals, handleDeleteProjectInternal]);

  const openDeleteProjectsModal = useCallback((projects: Project[]) => {
    setSelectedProjects(projects);
    if (deletePrompts.deleteProjects.shouldShow) {
      modals.openModal('deleteProjects');
    } else {
      // Delete immediately without prompt - use internal handler
      handleDeleteProjectsInternal(projects);
    }
  }, [deletePrompts.deleteProjects.shouldShow, modals, handleDeleteProjectsInternal]);

  const handleCancelDeleteProject = useCallback(() => {
    modals.closeModal('deleteProject');
    setSelectedProjects([]);
  }, [modals]);

  // ==================== DELETE QUERIES HANDLERS ====================

  // Internal handler with parameter for direct deletion
  const handleDeleteQueriesInternal = useCallback((queries: UserQueryObject[]) => {
    deleteQueriesMutation.mutate(
      queries.map(q => q.sid),
      {
        onSuccess: () => {
          queryDeletedToast();
          modals.closeModal('deleteQueries');
          // if viewing current query (i.e. qid is in the URL), navigate to previous page
          const currentQid = getDataFromQueryVar('q', location.search);
          if(currentQid && queries.some(q => q.data.qid === currentQid)) {
            navigate('/query-history', { replace: true });
          }
          setSelectedQueries([]);
        },
        onError: () => errorToast('Failed to delete queries')
      }
    );
  }, [deleteQueriesMutation, modals, location.search, navigate]);

  // Modal handler (no params - reads from state)
  const handleDeleteSelectedQueries = useCallback(() => {
    if (selectedQueries.length > 0) {
      handleDeleteQueriesInternal(selectedQueries);
    }
  }, [handleDeleteQueriesInternal, selectedQueries]);
  
  const openDeleteQueriesModal = useCallback((queries: UserQueryObject[]) => {
    setSelectedQueries(queries);
    if (deletePrompts.deleteQueries.shouldShow) {
      modals.openModal('deleteQueries');
    } else {
      // Delete immediately without prompt - use internal handler
      handleDeleteQueriesInternal(queries);
    }
  }, [deletePrompts.deleteQueries.shouldShow, modals, handleDeleteQueriesInternal]);

  // ==================== PERMANENT DELETE HANDLERS ====================

  // Internal handler with parameter for direct deletion
  const handlePermanentDeleteProjectInternal = useCallback((project: Project) => {
    // TODO: Implement when backend endpoint is ready
    console.log('Permanent delete project confirmed', project);
    modals.closeModal('permanentDeleteProject');
    setSelectedProjects([]);
  }, [modals]);

  // Internal handler with parameter for direct deletion
  const handlePermanentDeleteQueryInternal = useCallback((query: UserQueryObject) => {
    // TODO: Implement when backend endpoint is ready
    console.log('Permanent delete query confirmed', query);
    modals.closeModal('permanentDeleteQuery');
    setSelectedQueries([]);
  }, [modals]);

  // Internal handler with parameter for direct deletion
  const handlePermanentDeleteSelectedInternal = useCallback((projects: Project[], queries: UserQueryObject[]) => {
    // TODO: Implement when backend endpoint is ready
    console.log('Permanent delete selected confirmed', projects, queries);
    modals.closeModal('permanentDeleteSelected');
    setSelectedProjects([]);
    setSelectedQueries([]);
  }, [modals]);

  // Modal handler (no params - reads from state)
  const handlePermanentDeleteProject = useCallback(() => {
    if (selectedProjects[0]) {
      handlePermanentDeleteProjectInternal(selectedProjects[0]);
    }
  }, [handlePermanentDeleteProjectInternal, selectedProjects]);

  // Modal handler (no params - reads from state)
  const handlePermanentDeleteQuery = useCallback(() => {
    if (selectedQueries[0]) {
      handlePermanentDeleteQueryInternal(selectedQueries[0]);
    }
  }, [handlePermanentDeleteQueryInternal, selectedQueries]);

  // Modal handler (no params - reads from state)
  const handlePermanentDeleteSelected = useCallback(() => {
    if (selectedProjects.length > 0 || selectedQueries.length > 0) {
      handlePermanentDeleteSelectedInternal(selectedProjects, selectedQueries);
    }
  }, [handlePermanentDeleteSelectedInternal, selectedProjects, selectedQueries]);
  
  const openPermanentDeleteProjectModal = useCallback((project: Project) => {
    setSelectedProjects([project]);
    if (deletePrompts.permanentDeleteProject.shouldShow) {
      modals.openModal('permanentDeleteProject');
    } else {
      // Delete immediately without prompt - use internal handler
      handlePermanentDeleteProjectInternal(project);
    }
  }, [deletePrompts.permanentDeleteProject.shouldShow, modals, handlePermanentDeleteProjectInternal]);

  const openPermanentDeleteQueryModal = useCallback((query: UserQueryObject) => {
    setSelectedQueries([query]);
    if (deletePrompts.permanentDeleteQuery.shouldShow) {
      modals.openModal('permanentDeleteQuery');
    } else {
      // Delete immediately without prompt - use internal handler
      handlePermanentDeleteQueryInternal(query);
    }
  }, [deletePrompts.permanentDeleteQuery.shouldShow, modals, handlePermanentDeleteQueryInternal]);

  const openPermanentDeleteSelectedModal = useCallback((projects: Project[], queries: UserQueryObject[]) => {
    setSelectedProjects(projects);
    setSelectedQueries(queries);
    if (deletePrompts.permanentDeleteSelected.shouldShow) {
      modals.openModal('permanentDeleteSelected');
    } else {
      // Delete immediately without prompt - use internal handler
      handlePermanentDeleteSelectedInternal(projects, queries);
    }
  }, [deletePrompts.permanentDeleteSelected.shouldShow, modals, handlePermanentDeleteSelectedInternal]);

  const handleCancelClosePermanentDeleteProject = useCallback(() => {
    modals.closeModal('permanentDeleteProject');
    setSelectedProjects([]);
  }, [modals]);

  const handleCancelClosePermanentDeleteQuery = useCallback(() => {
    modals.closeModal('permanentDeleteQuery');
    setSelectedQueries([]);
  }, [modals]);

  const handleCancelClosePermanentDeleteSelected = useCallback(() => {
    modals.closeModal('permanentDeleteSelected');
    setSelectedProjects([]);
    setSelectedQueries([]);
  }, [modals]);

  // ==================== EMPTY TRASH HANDLERS ====================
  
  const openEmptyTrashModal = useCallback(() => {
    if (deletePrompts.emptyTrash.shouldShow) {
      modals.openModal('emptyTrash');
    } else {
      // TODO: Implement when backend endpoint is ready
      console.log('Empty trash');
    }
  }, [deletePrompts.emptyTrash.shouldShow, modals]);

  const handleEmptyTrash = useCallback(() => {
    // TODO: Implement when backend endpoint is ready
    console.log('Empty trash confirmed');
    modals.closeModal('emptyTrash');
  }, [modals]);

  const handleCancelCloseEmptyTrash = useCallback(() => {
    modals.closeModal('emptyTrash');
  }, [modals]);

  // ==================== OTHER MODALS ====================
  
  const openEditQueryModal = useCallback((data: EditQueryModalData) => {
    setEditQueryModalData(data);
  }, []);

  const openShareQueryModal = useCallback((query: UserQueryObject) => {
    setSharedQuery(query);
    modals.openModal('shareQuery');
  }, [modals]);

  const closeModal = useCallback((modalType: string) => {
    modals.closeModal(modalType as keyof typeof modals.modals);
    
    // Clear data when closing
    if (modalType === 'shareQuery') {
      setSharedQuery(null);
    }
  }, [modals]);

  // ==================== DELETION HANDLERS FOR ProjectModals ====================
  
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
    handleCancelDeleteProject
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
    handleCancelDeleteProject
  ]);

  // ==================== CONTEXT VALUE ====================
  
  const contextValue = useMemo<ProjectModalsContextValue>(() => ({
    openDeleteProjectModal,
    openDeleteProjectsModal,
    openDeleteQueriesModal,
    openPermanentDeleteProjectModal,
    openPermanentDeleteQueryModal,
    openPermanentDeleteSelectedModal,
    openEmptyTrashModal,
    openEditQueryModal,
    openShareQueryModal
  }), [
    openDeleteProjectModal,
    openDeleteProjectsModal,
    openDeleteQueriesModal,
    openPermanentDeleteProjectModal,
    openPermanentDeleteQueryModal,
    openPermanentDeleteSelectedModal,
    openEmptyTrashModal,
    openEditQueryModal,
    openShareQueryModal
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
        editQueryModal={editQueryModalData || undefined}
        shareQueryModal={sharedQuery ? {
          sharedQuery: sharedQuery,
          onClose: () => {
            setSharedQuery(null);
            closeModal('shareQuery');
          }
        } : undefined}
      />
    </ProjectModalsContext.Provider>
  );
};
