import { Dispatch, SetStateAction } from 'react';
import ProjectDeleteWarningModal from '@/features/Projects/components/ProjectDeleteWarningModal/ProjectDeleteWarningModal';
import WarningModal from '@/features/Common/components/WarningModal/WarningModal';
import EditQueryModal from '@/features/Projects/components/EditQueryModal/EditQueryModal';
import { Project, UserQueryObject, QueryEditingItem, ProjectRaw } from '@/features/Projects/types/projects.d';
import ShareModal from '@/features/ResultList/components/ShareModal/ShareModal';
import { getTypeIDFromType } from '@/features/Projects/utils/utilities';
import { Link } from 'react-router-dom';

interface ProjectModalsProps {
  modals: Record<string, boolean>;
  selectedProjects: Project[];
  selectedQueries: UserQueryObject[];
  onCloseModal: (modalType: string) => void;
  setSelectedProjects?: Dispatch<SetStateAction<Project[]>>;
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
    queries: UserQueryObject[];
    setSelectedProject?: (project: ProjectRaw) => void;
  };
  shareQueryModal?: {
    sharedQuery: UserQueryObject | null;
    onClose: () => void;
  };
}

const ProjectModals = ({
  modals,
  selectedProjects,
  selectedQueries,
  onCloseModal,
  setSelectedProjects,
  deletionHandlers,
  deletePrompts,
  currentProject,
  variant = 'list',
  editQueryModal,
  shareQueryModal
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
      {/* Delete Project Prompt */}
      {(modals.deleteProjects || modals.deleteProject) && (
        <ProjectDeleteWarningModal
          isOpen={modals.deleteProjects || modals.deleteProject}
          onClose={handleCloseDeleteProjects}
          onConfirm={handleConfirmDeleteProjects}
          onCancel={handleCancelDeleteProjects}
          heading={`${projectCount > 1 ? `Delete ${projectCount} Projects` : 'Delete Project'}?`}
          content={<p>Queries in this project, along with any bookmarks or notes associated with them, will not be deleted and will still be available from your <Link to="/queries" target="_blank">Query History</Link>.</p>}
          cancelButtonText="Cancel"
          confirmButtonText={`${projectCount > 1 ? `Delete ${projectCount} Projects` : 'Delete Project'}`}
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
          heading={`${selectedQueries.length > 1 ? `Delete ${selectedQueries.length} Queries` : 'Delete this Query'}?`}
          content={`This action cannot be undone.`}
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
          activeQueries={editQueryModal.queries}
          setSelectedProject={editQueryModal.setSelectedProject}
        />
      )}

      {/* Share Query Modal */}
      {modals.shareQuery && shareQueryModal?.sharedQuery && (
      <ShareModal
        isOpen={modals.shareQuery}
        onClose={shareQueryModal.onClose}
        qid={shareQueryModal.sharedQuery.data.qid || ''}
        label={shareQueryModal.sharedQuery.data.query.node_one_label || ''}
        nodeID={shareQueryModal.sharedQuery.data.query.curie || ''}
        typeID={shareQueryModal.sharedQuery.data.query.type ? getTypeIDFromType(shareQueryModal.sharedQuery.data.query.type, shareQueryModal.sharedQuery.data.query.direction || null).toString() : null}
      />
      )}
    </>
  );
};

export default ProjectModals;
