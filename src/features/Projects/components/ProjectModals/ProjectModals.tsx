import { Dispatch, SetStateAction, ReactNode } from 'react';
import ProjectDeleteWarningModal from '@/features/Projects/components/ProjectDeleteWarningModal/ProjectDeleteWarningModal';
import WarningModal from '@/features/Core/components/WarningModal/WarningModal';
import { Project, UserQueryObject } from '@/features/Projects/types/projects.d';
import ShareModal from '@/features/ResultList/components/ShareModal/ShareModal';
import { getTypeIDFromType } from '@/features/Projects/utils/utilities';
import { Link } from 'react-router-dom';

interface DeletionHandlers {
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
  handleDeleteProject?: () => void;
  handleCancelDeleteProject?: () => void;
}

interface ProjectModalsProps {
  modals: Record<string, boolean>;
  selectedProjects: Project[];
  selectedQueries: UserQueryObject[];
  onCloseModal: (modalType: string) => void;
  setSelectedProjects?: Dispatch<SetStateAction<Project[]>>;
  deletionHandlers: DeletionHandlers;
  deletePrompts: Record<string, { setHideDeletePrompt: (hide: boolean) => void }>;
  currentProject?: Project;
  variant?: 'list' | 'detail';
  shareQueryModal?: {
    sharedQuery: UserQueryObject | null;
    onClose: () => void;
  };
}

type PromptConfig = {
  key: string;
  isOpen: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  heading: string;
  content: ReactNode;
  confirmButtonText: string;
  setStorageKeyFn?: (hide: boolean) => void;
};

const deleteCountLabel = (count: number, singular: string, plural: string) =>
  (count > 1 ? plural : singular);

const projectDeleteHeading = (count: number) => {
  const label = count > 1 ? `Delete ${count} Projects` : 'Delete Project';
  return `${label}?`;
};

const queryDeleteHeading = (count: number) => {
  const label = count > 1 ? `Delete ${count} Queries` : 'Delete this Query';
  return `${label}?`;
};

const SimpleWarningPrompt = ({
  isOpen,
  onClose,
  onConfirm,
  heading,
  content,
  confirmButtonText,
  setStorageKeyFn,
}: Omit<PromptConfig, 'key'>) => {
  if (!onClose || !onConfirm) return null;
  return (
    <WarningModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      onCancel={onClose}
      heading={heading}
      content={content}
      cancelButtonText="Cancel"
      confirmButtonText={confirmButtonText}
      setStorageKeyFn={setStorageKeyFn}
    />
  );
};

const buildPermanentPrompts = (
  modals: Record<string, boolean>,
  deletionHandlers: DeletionHandlers,
  deletePrompts: ProjectModalsProps['deletePrompts'],
): PromptConfig[] => [
  {
    key: 'permanentDeleteProject',
    isOpen: !!modals.permanentDeleteProject,
    onClose: deletionHandlers.handleCancelClosePermanentDeleteProject,
    onConfirm: deletionHandlers.handlePermanentDeleteProject,
    heading: 'Permanently Delete Project?',
    content: 'This action cannot be undone.',
    confirmButtonText: 'Delete Project',
    setStorageKeyFn: deletePrompts.permanentDeleteProject?.setHideDeletePrompt,
  },
  {
    key: 'permanentDeleteQuery',
    isOpen: !!modals.permanentDeleteQuery,
    onClose: deletionHandlers.handleCancelClosePermanentDeleteQuery,
    onConfirm: deletionHandlers.handlePermanentDeleteQuery,
    heading: 'Permanently Delete Query?',
    content: 'This action cannot be undone.',
    confirmButtonText: 'Delete Query',
    setStorageKeyFn: deletePrompts.permanentDeleteQuery?.setHideDeletePrompt,
  },
  {
    key: 'permanentDeleteSelected',
    isOpen: !!modals.permanentDeleteSelected,
    onClose: deletionHandlers.handleCancelClosePermanentDeleteSelected,
    onConfirm: deletionHandlers.handlePermanentDeleteSelected,
    heading: 'Permanently Delete Selected?',
    content: 'This action cannot be undone.',
    confirmButtonText: 'Delete Selected',
    setStorageKeyFn: deletePrompts.permanentDeleteSelected?.setHideDeletePrompt,
  },
  {
    key: 'emptyTrash',
    isOpen: !!modals.emptyTrash,
    onClose: deletionHandlers.handleCancelCloseEmptyTrash,
    onConfirm: deletionHandlers.handleEmptyTrash,
    heading: 'Empty Trash?',
    content: 'Emptying the trash permanently deletes all projects and queries you have deleted. This action cannot be undone.',
    confirmButtonText: 'Empty Trash',
    setStorageKeyFn: deletePrompts.emptyTrash?.setHideDeletePrompt,
  },
];

const ShareQueryPrompt = ({
  isOpen,
  shareQueryModal,
}: {
  isOpen: boolean;
  shareQueryModal?: ProjectModalsProps['shareQueryModal'];
}) => {
  if (!isOpen || !shareQueryModal?.sharedQuery) return null;
  const { sharedQuery, onClose } = shareQueryModal;
  const typeID = sharedQuery.data.query.type
    ? getTypeIDFromType(sharedQuery.data.query.type, sharedQuery.data.query.direction || null).toString()
    : null;
  return (
    <ShareModal
      isOpen={isOpen}
      onClose={onClose}
      qid={sharedQuery.data.qid || ''}
      label={sharedQuery.data.query.node_one_label || ''}
      nodeID={sharedQuery.data.query.curie || ''}
      typeID={typeID}
    />
  );
};

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
  shareQueryModal,
}: ProjectModalsProps) => {
  const isDetailVariant = variant === 'detail';
  const projectsToDelete = isDetailVariant && currentProject ? [currentProject] : selectedProjects;
  const projectCount = projectsToDelete.length;
  const deleteProjectsOpen = modals.deleteProjects || modals.deleteProject;

  const dismissDeleteProjects = () => {
    if (isDetailVariant) {
      deletionHandlers.handleCancelDeleteProject?.();
      return;
    }
    onCloseModal('deleteProjects');
    setSelectedProjects?.([]);
  };

  const handleConfirmDeleteProjects = () => {
    if (isDetailVariant) {
      deletionHandlers.handleDeleteProject?.();
      return;
    }
    deletionHandlers.handleDeleteSelectedProjects?.();
  };

  const permanentPrompts = buildPermanentPrompts(modals, deletionHandlers, deletePrompts)
    .filter(prompt => prompt.isOpen && prompt.onClose && prompt.onConfirm);

  return (
    <>
      {deleteProjectsOpen && (
        <ProjectDeleteWarningModal
          isOpen={deleteProjectsOpen}
          onClose={dismissDeleteProjects}
          onConfirm={handleConfirmDeleteProjects}
          onCancel={dismissDeleteProjects}
          heading={projectDeleteHeading(projectCount)}
          content={(
            <p>
              Queries in this project, along with any bookmarks or notes associated with them, will not be deleted and will still be available from your{' '}
              <Link to="/query-history" target="_blank">Query History</Link>.
            </p>
          )}
          cancelButtonText="Cancel"
          confirmButtonText={deleteCountLabel(
            projectCount,
            'Delete Project',
            `Delete ${projectCount} Projects`,
          )}
          setStorageKeyFn={deletePrompts.deleteProjects?.setHideDeletePrompt}
        />
      )}

      {modals.deleteQueries && deletionHandlers.handleDeleteSelectedQueries && (
        <SimpleWarningPrompt
          isOpen={modals.deleteQueries}
          onClose={() => onCloseModal('deleteQueries')}
          onConfirm={deletionHandlers.handleDeleteSelectedQueries}
          heading={queryDeleteHeading(selectedQueries.length)}
          content={selectedQueries.length > 1
            ? 'These queries, along with any bookmarks or notes associated with them, can be recovered from your Trash.'
            : 'This query, along with any bookmarks or notes associated with it, can be recovered from your Trash.'}
          confirmButtonText={`Delete Quer${selectedQueries.length > 1 ? 'ies' : 'y'}`}
          setStorageKeyFn={deletePrompts.deleteQueries?.setHideDeletePrompt}
        />
      )}

      {permanentPrompts.map(({ key, ...prompt }) => (
        <SimpleWarningPrompt key={key} {...prompt} />
      ))}

      <ShareQueryPrompt isOpen={!!modals.shareQuery} shareQueryModal={shareQueryModal} />
    </>
  );
};

export default ProjectModals;
