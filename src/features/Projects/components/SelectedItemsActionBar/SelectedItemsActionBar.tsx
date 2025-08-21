import Button from '@/features/Core/components/Button/Button';
import FolderIcon from '@/assets/icons/projects/folder.svg?react';
import TrashIcon from '@/assets/icons/buttons/TrashFilled.svg?react';
import TrashUnfilledIcon from '@/assets/icons/buttons/Trash.svg?react';
import { Project, UserQueryObject } from '@/features/Projects/types/projects.d';

interface SelectedItemsActionBarProps {
  selectedProjects: Project[];
  selectedQueries: UserQueryObject[];
  activeTab: string;
  projectEditingState: { isEditing: boolean };
  onDeleteSelected: () => void;
  onPermanentDeleteSelected: () => void;
  onEmptyTrash: () => void;
  onAddToProject?: () => void;
  styles: Record<string, string>;
}

const SelectedItemsActionBar = ({
  selectedProjects,
  selectedQueries,
  activeTab,
  projectEditingState,
  onDeleteSelected,
  onPermanentDeleteSelected,
  onEmptyTrash,
  onAddToProject,
  styles
}: SelectedItemsActionBarProps) => {
  const totalSelected = selectedProjects.length + selectedQueries.length;
  
  if (totalSelected === 0) return null;

  return (
    <div className={styles.selectedInteractions}>
      <span>{totalSelected} Selected</span>
      {activeTab === 'Trash' ? (
        <>                          
          <Button
            handleClick={onPermanentDeleteSelected}
            iconLeft={<TrashIcon />}
            small
            className={styles.button}
          >
            Delete Selected
          </Button>
          <Button
            handleClick={onEmptyTrash}
            iconLeft={<TrashUnfilledIcon />}
            small
            className={styles.button}
          >
            Empty Trash
          </Button>
        </>
      ) : (
        <>
          {(selectedQueries.length > 0 && !projectEditingState.isEditing) && onAddToProject && (
            <Button
              variant="secondary"
              handleClick={onAddToProject}
              iconLeft={<FolderIcon />}
              small
              className={styles.button}
            >
              Add to Project
            </Button>
          )}
          <Button
            variant="secondary"
            handleClick={onDeleteSelected}
            iconLeft={<TrashIcon />}
            small
            className={styles.button}
          >
            Delete
          </Button>
        </>
      )}
    </div>
  );
};

export default SelectedItemsActionBar;
