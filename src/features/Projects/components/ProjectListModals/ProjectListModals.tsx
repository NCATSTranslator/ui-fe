import { Dispatch, SetStateAction } from 'react';
import ProjectDeleteWarningModal from '@/features/Projects/components/ProjectDeleteWarningModal/ProjectDeleteWarningModal';
import WarningModal from '@/features/Common/components/WarningModal/WarningModal';
import { Project, UserQueryObject } from '@/features/Projects/types/projects.d';

interface ProjectListModalsProps {
  modals: {
    deleteProjects: boolean;
    deleteQueries: boolean;
    permanentDeleteProject: boolean;
    permanentDeleteQuery: boolean;
    permanentDeleteSelected: boolean;
    emptyTrash: boolean;
  };
  selectedProjects: Project[];
  selectedQueries: UserQueryObject[];
  onCloseModal: (modalType: keyof ProjectListModalsProps['modals']) => void;
  setSelectedProjects: Dispatch<SetStateAction<Project[]>>;
  setSelectedQueries: Dispatch<SetStateAction<UserQueryObject[]>>;
  deletionHandlers: {
    handleDeleteSelectedProjects: () => void;
    handleDeleteSelectedQueries: () => void;
    handlePermanentDeleteProject: () => void;
    handlePermanentDeleteQuery: () => void;
    handlePermanentDeleteSelected: () => void;
    handleEmptyTrash: () => void;
    handleCancelClosePermanentDeleteProject: () => void;
    handleCancelClosePermanentDeleteQuery: () => void;
    handleCancelClosePermanentDeleteSelected: () => void;
    handleCancelCloseEmptyTrash: () => void;
  };
  deletePrompts: {
    deleteProjects: { setHideDeletePrompt: (hide: boolean) => void };
    deleteQueries: { setHideDeletePrompt: (hide: boolean) => void };
    permanentDeleteProject: { setHideDeletePrompt: (hide: boolean) => void };
    permanentDeleteQuery: { setHideDeletePrompt: (hide: boolean) => void };
    permanentDeleteSelected: { setHideDeletePrompt: (hide: boolean) => void };
    emptyTrash: { setHideDeletePrompt: (hide: boolean) => void };
  };
}

const ProjectListModals = ({
  modals,
  selectedProjects,
  selectedQueries,
  onCloseModal,
  setSelectedProjects,
  setSelectedQueries,
  deletionHandlers,
  deletePrompts
}: ProjectListModalsProps) => {
  return (
    <>
      {/* Delete Project Prompt */}
      <ProjectDeleteWarningModal
        isOpen={modals.deleteProjects}
        onClose={() => {
          onCloseModal('deleteProjects');
          setSelectedProjects([]);
        }}
        onConfirm={deletionHandlers.handleDeleteSelectedProjects}
        onCancel={() => {
          onCloseModal('deleteProjects');
          setSelectedProjects([]);
        }}
        heading={`Delete ${selectedProjects.length} project${selectedProjects.length > 1 ? 's' : ''}?`}
        content={`${selectedProjects.length > 1 ? 'These projects can be recovered from your Trash.' : 'This project can be recovered from your Trash.'}`}
        cancelButtonText="Cancel"
        confirmButtonText={`Delete Project${selectedProjects.length > 1 ? 's' : ''}`}
        setStorageKeyFn={deletePrompts.deleteProjects.setHideDeletePrompt}
      />

      {/* Delete Query Prompt */}
      <WarningModal
        isOpen={modals.deleteQueries}
        onClose={() => onCloseModal('deleteQueries')}
        onConfirm={deletionHandlers.handleDeleteSelectedQueries}
        onCancel={() => onCloseModal('deleteQueries')}
        heading={`Delete ${selectedQueries.length} quer${selectedQueries.length > 1 ? 'ies' : 'y'}?`}
        content={`${selectedQueries.length > 1 ? 'These queries can be recovered from your Trash.' : 'This query can be recovered from your Trash.'}`}
        cancelButtonText="Cancel"
        confirmButtonText={`Delete Quer${selectedQueries.length > 1 ? 'ies' : 'y'}`}
        setStorageKeyFn={deletePrompts.deleteQueries.setHideDeletePrompt}
      />

      {/* Permanent Delete Project Prompt */}
      <WarningModal
        isOpen={modals.permanentDeleteProject}
        onClose={deletionHandlers.handleCancelClosePermanentDeleteProject}
        onConfirm={deletionHandlers.handlePermanentDeleteProject}
        onCancel={deletionHandlers.handleCancelClosePermanentDeleteProject}
        heading={`Permanently Delete Project?`}
        content={`This action cannot be undone.`}
        cancelButtonText="Cancel"
        confirmButtonText={`Delete Project`}
        setStorageKeyFn={deletePrompts.permanentDeleteProject.setHideDeletePrompt}
      />

      {/* Permanent Delete Query Prompt */}
      <WarningModal
        isOpen={modals.permanentDeleteQuery}
        onClose={deletionHandlers.handleCancelClosePermanentDeleteQuery}
        onConfirm={deletionHandlers.handlePermanentDeleteQuery}
        onCancel={deletionHandlers.handleCancelClosePermanentDeleteQuery}
        heading={`Permanently Delete Query?`}
        content={`This action cannot be undone.`}
        cancelButtonText="Cancel"
        confirmButtonText={`Delete Query`}
        setStorageKeyFn={deletePrompts.permanentDeleteQuery.setHideDeletePrompt}
      />

      {/* Permanent Delete Selected Prompt */}
      <WarningModal
        isOpen={modals.permanentDeleteSelected}
        onClose={deletionHandlers.handleCancelClosePermanentDeleteSelected}
        onConfirm={deletionHandlers.handlePermanentDeleteSelected}
        onCancel={deletionHandlers.handleCancelClosePermanentDeleteSelected}
        heading={`Permanently Delete Selected?`}
        content={`This action cannot be undone.`}
        cancelButtonText="Cancel"
        confirmButtonText={`Delete Selected`}
        setStorageKeyFn={deletePrompts.permanentDeleteSelected.setHideDeletePrompt}
      />

      {/* Empty Trash Prompt */}
      <WarningModal
        isOpen={modals.emptyTrash}
        onClose={deletionHandlers.handleCancelCloseEmptyTrash}
        onConfirm={deletionHandlers.handleEmptyTrash}
        onCancel={deletionHandlers.handleCancelCloseEmptyTrash}
        heading={`Empty Trash?`}
        content={`Emptying the trash permanently deletes all projects and queries you have deleted. This action cannot be undone.`}
        cancelButtonText="Cancel"
        confirmButtonText={`Empty Trash`}
        setStorageKeyFn={deletePrompts.emptyTrash.setHideDeletePrompt}
      />
    </>
  );
};

export default ProjectListModals;
