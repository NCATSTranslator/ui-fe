import { Dispatch, SetStateAction } from 'react';
import ProjectDeleteWarningModal from '@/features/Projects/components/ProjectDeleteWarningModal/ProjectDeleteWarningModal';
import WarningModal from '@/features/Common/components/WarningModal/WarningModal';
import EditQueryModal from '@/features/Projects/components/EditQueryModal/EditQueryModal';
import { Project, UserQueryObject, QueryEditingItem, ProjectRaw } from '@/features/Projects/types/projects.d';

interface ProjectModalsProps {
  modals: Record<string, boolean>;
  selectedProjects: Project[];
  selectedQueries: UserQueryObject[];
  onCloseModal: (modalType: string) => void;
  setSelectedProjects?: Dispatch<SetStateAction<Project[]>>;
  setSelectedQueries?: Dispatch<SetStateAction<UserQueryObject[]>>;
  deletionHandlers: {
    handleDeleteSelectedProjects?: () => void;
    handleDeleteSelectedQueries?: () => void;
    handlePermanentDeleteProject?: () => void;
    handlePermanentDeleteQuery?: () => void;
    handlePermanentDeleteSelected?: () => void;
    handleEmptyTrash?: () => void;
    handleCancelClosePermanentDeleteProject?: () => void;
    handleCancelClosePermanentDeleteQuery?: () => void;
    handleCancelClosePermanentDeleteSelected?: () => void;
    handleCancelCloseEmptyTrash?: () => void;
    handleDeleteProject?: (project: Project) => void;
    handleCancelDeleteProject?: () => void;
  };
  deletePrompts: Record<string, { setHideDeletePrompt: (hide: boolean) => void }>;
  currentProject?: Project;
  variant?: 'list' | 'detail';
  editQueryModal?: {
    currentEditingQueryItem?: QueryEditingItem;
    handleClose?: () => void;
    isOpen: boolean;
    loading: boolean;
    mode: 'edit' | 'add';
    projects: ProjectRaw[];
    setSelectedProject?: (project: ProjectRaw) => void;
  };
}

const ProjectModals = ({
  modals,
  selectedProjects,
  selectedQueries,
  onCloseModal,
  setSelectedProjects,
  setSelectedQueries,
  deletionHandlers,
  deletePrompts,
  currentProject,
  variant = 'list',
  editQueryModal
}: ProjectModalsProps) => {
  const isDetailVariant = variant === 'detail';
  
  // For detail variant, use currentProject, otherwise use selectedProjects
  const projectsToDelete = isDetailVariant && currentProject ? [currentProject] : selectedProjects;
  const projectCount = projectsToDelete.length;

  const handleCloseDeleteProjects = () => {
    if (isDetailVariant) {
      deletionHandlers.handleCancelDeleteProject?.();
    } else {
      onCloseModal('deleteProjects');
      setSelectedProjects?.([]);
    }
  };

  const handleConfirmDeleteProjects = () => {
    if (isDetailVariant && currentProject) {
      deletionHandlers.handleDeleteProject?.(currentProject);
    } else {
      deletionHandlers.handleDeleteSelectedProjects?.();
    }
  };

  const handleCancelDeleteProjects = () => {
    if (isDetailVariant) {
      deletionHandlers.handleCancelDeleteProject?.();
    } else {
      onCloseModal('deleteProjects');
      setSelectedProjects?.([]);
    }
  };

  return (
    <>
      {/* Delete Project Prompt - Works for both list and detail variants */}
      {(modals.deleteProjects || modals.deleteProject) && (
        <ProjectDeleteWarningModal
          isOpen={modals.deleteProjects || modals.deleteProject}
          onClose={handleCloseDeleteProjects}
          onConfirm={handleConfirmDeleteProjects}
          onCancel={handleCancelDeleteProjects}
          heading={`Delete ${projectCount} project${projectCount > 1 ? 's' : ''}?`}
          content={`${projectCount > 1 ? 'These projects can be recovered from your Trash.' : 'This project can be recovered from your Trash.'}`}
          cancelButtonText="Cancel"
          confirmButtonText={`Delete Project${projectCount > 1 ? 's' : ''}`}
          setStorageKeyFn={deletePrompts.deleteProjects?.setHideDeletePrompt}
        />
      )}

      {/* Delete Query Prompt */}
      {modals.deleteQueries && deletionHandlers.handleDeleteSelectedQueries && (
        <WarningModal
          isOpen={modals.deleteQueries}
          onClose={() => onCloseModal('deleteQueries')}
          onConfirm={deletionHandlers.handleDeleteSelectedQueries}
          onCancel={() => onCloseModal('deleteQueries')}
          heading={`Delete ${selectedQueries.length} quer${selectedQueries.length > 1 ? 'ies' : 'y'}?`}
          content={`${selectedQueries.length > 1 ? 'These queries can be recovered from your Trash.' : 'This query can be recovered from your Trash.'}`}
          cancelButtonText="Cancel"
          confirmButtonText={`Delete Quer${selectedQueries.length > 1 ? 'ies' : 'y'}`}
          setStorageKeyFn={deletePrompts.deleteQueries?.setHideDeletePrompt}
        />
      )}

      {/* Permanent Delete Project Prompt */}
      {modals.permanentDeleteProject && 
       deletionHandlers.handleCancelClosePermanentDeleteProject && 
       deletionHandlers.handlePermanentDeleteProject && (
        <WarningModal
          isOpen={modals.permanentDeleteProject}
          onClose={deletionHandlers.handleCancelClosePermanentDeleteProject}
          onConfirm={deletionHandlers.handlePermanentDeleteProject}
          onCancel={deletionHandlers.handleCancelClosePermanentDeleteProject}
          heading={`Permanently Delete Project?`}
          content={`This action cannot be undone.`}
          cancelButtonText="Cancel"
          confirmButtonText={`Delete Project`}
          setStorageKeyFn={deletePrompts.permanentDeleteProject?.setHideDeletePrompt}
        />
      )}

      {/* Permanent Delete Query Prompt */}
      {modals.permanentDeleteQuery && 
       deletionHandlers.handleCancelClosePermanentDeleteQuery && 
       deletionHandlers.handlePermanentDeleteQuery && (
        <WarningModal
          isOpen={modals.permanentDeleteQuery}
          onClose={deletionHandlers.handleCancelClosePermanentDeleteQuery}
          onConfirm={deletionHandlers.handlePermanentDeleteQuery}
          onCancel={deletionHandlers.handleCancelClosePermanentDeleteQuery}
          heading={`Permanently Delete Query?`}
          content={`This action cannot be undone.`}
          cancelButtonText="Cancel"
          confirmButtonText={`Delete Query`}
          setStorageKeyFn={deletePrompts.permanentDeleteQuery?.setHideDeletePrompt}
        />
      )}

      {/* Permanent Delete Selected Prompt */}
      {modals.permanentDeleteSelected && 
       deletionHandlers.handleCancelClosePermanentDeleteSelected && 
       deletionHandlers.handlePermanentDeleteSelected && (
        <WarningModal
          isOpen={modals.permanentDeleteSelected}
          onClose={deletionHandlers.handleCancelClosePermanentDeleteSelected}
          onConfirm={deletionHandlers.handlePermanentDeleteSelected}
          onCancel={deletionHandlers.handleCancelClosePermanentDeleteSelected}
          heading={`Permanently Delete Selected?`}
          content={`This action cannot be undone.`}
          cancelButtonText="Cancel"
          confirmButtonText={`Delete Selected`}
          setStorageKeyFn={deletePrompts.permanentDeleteSelected?.setHideDeletePrompt}
        />
      )}

      {/* Empty Trash Prompt */}
      {modals.emptyTrash && 
       deletionHandlers.handleCancelCloseEmptyTrash && 
       deletionHandlers.handleEmptyTrash && (
        <WarningModal
          isOpen={modals.emptyTrash}
          onClose={deletionHandlers.handleCancelCloseEmptyTrash}
          onConfirm={deletionHandlers.handleEmptyTrash}
          onCancel={deletionHandlers.handleCancelCloseEmptyTrash}
          heading={`Empty Trash?`}
          content={`Emptying the trash permanently deletes all projects and queries you have deleted. This action cannot be undone.`}
          cancelButtonText="Cancel"
          confirmButtonText={`Empty Trash`}
          setStorageKeyFn={deletePrompts.emptyTrash?.setHideDeletePrompt}
        />
      )}

      {/* Edit Query Modal */}
      {editQueryModal && (
        <EditQueryModal
          currentEditingQueryItem={editQueryModal.currentEditingQueryItem}
          handleClose={editQueryModal.handleClose}
          isOpen={editQueryModal.isOpen}
          loading={editQueryModal.loading}
          mode={editQueryModal.mode}
          projects={editQueryModal.projects}
          setSelectedProject={editQueryModal.setSelectedProject}
        />
      )}
    </>
  );
};

export default ProjectModals;
