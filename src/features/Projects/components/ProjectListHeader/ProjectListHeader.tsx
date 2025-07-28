import { FC, useCallback, useState } from 'react';
import { debounce } from 'lodash';
import Button from '@/features/Core/components/Button/Button';
import styles from './ProjectListHeader.module.scss';
import FolderPlus from '@/assets/icons/projects/folderplus.svg?react';
import TextInput from '@/features/Core/components/TextInput/TextInput';
import Search from '@/assets/icons/buttons/search.svg?react';
import Close from '@/assets/icons/buttons/Close/Close.svg?react';
import Checkmark from '@/assets/icons/buttons/Checkmark/Checkmark.svg?react';
import { useCreateProject } from '@/features/Projects/hooks/customHooks';

interface ProjectListHeaderProps {
  searchTerm?: string;
  setSearchTerm?: (searchTerm: string) => void;
}

const ProjectListHeader: FC<ProjectListHeaderProps> = ({
  searchTerm = "",
  setSearchTerm
}) => {

  const placeholderText = 'Search by Project or Query Name';
  const [isEditing, setIsEditing] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectNameError, setProjectNameError] = useState('');
  
  const createProjectMutation = useCreateProject();

  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      setSearchTerm?.(searchTerm);
    }, 500),
    [setSearchTerm]
  );

  const handleSearch = (e: string) => {
    if (e.length > 0)
      debouncedSearch(e);
    else
      setSearchTerm?.('');
  }

  const handleCreateNewClick = () => {
    if (isEditing) {
      // Handle Done Editing
      if (!projectName.trim()) {
        setProjectNameError('Project name is required');
        return;
      }
      
      // Create the project using the mutation
      createProjectMutation.mutate({
        title: projectName.trim(),
        pks: [] // Empty array for now, can be extended later
      }, {
        onSuccess: () => {
          // Reset form on successful creation
          setIsEditing(false);
          setProjectName('');
          setProjectNameError('');
        },
        onError: (error) => {
          // Handle error - you might want to show a toast or error message
          console.error('Failed to create project:', error);
          setProjectNameError('Failed to create project. Please try again.');
        }
      });
    } else {
      // Enter editing mode
      setIsEditing(true);
      setProjectName('');
      setProjectNameError('');
    }
  }

  const handleCancelClick = () => {
    setIsEditing(false);
    setProjectName('');
    setProjectNameError('');
  }

  const handleProjectNameChange = (value: string) => {
    setProjectName(value);
    if (projectNameError && value.trim()) {
      setProjectNameError('');
    }
  }

  return (
    <div className={styles.projectListHeader}>
      <div className={styles.top}>
        <div className={styles.left}>
          <h1 className={`h4`}>Projects</h1>
          {isEditing 
            ? 
              (
                <div className={styles.editButtons}>
                  <Button
                    iconLeft={<Checkmark />}
                    handleClick={handleCreateNewClick}
                    disabled={createProjectMutation.isPending}
                    small
                    className={styles.doneButton}
                  >
                    {createProjectMutation.isPending ? 'Creating...' : 'Done Editing'}
                  </Button>
                  <Button
                    variant="secondary"
                    iconLeft={<Close />}
                    handleClick={handleCancelClick}
                    disabled={createProjectMutation.isPending}
                    small
                  >
                    Cancel
                  </Button>
                </div>
              ) 
            : (
                <Button
                  iconLeft={<FolderPlus />}
                  handleClick={handleCreateNewClick}
                  small
                >
                  Create New
                </Button>
              )
          }
        </div>
        <div className={styles.right}>
          <TextInput
            placeholder={placeholderText}
            iconLeft={<Search />}
            iconRight={searchTerm.length > 0 ? <Close /> : null}
            handleChange={handleSearch}
            className={styles.searchInput}
            iconRightClickToReset={searchTerm.length > 0}
          />
        </div>
      </div>
      {
        isEditing && (
          <div className={styles.editContainer}>
            <TextInput
              label="Project Name"
              value={projectName}
              handleChange={handleProjectNameChange}
              error={!!projectNameError}
              errorBottom
              errorText={projectNameError}
              className={styles.projectNameInput}
              disabled={createProjectMutation.isPending}
              placeholder="Unnamed Project"
            />
          </div>
        )
      }
    </div>
  );
}

export default ProjectListHeader;