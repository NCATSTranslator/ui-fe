import { FC, FormEvent, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import Button from '@/features/Core/components/Button/Button';
import TextInput from '@/features/Core/components/TextInput/TextInput';
import Close from '@/assets/icons/buttons/Close/Close.svg?react';
import Checkmark from '@/assets/icons/buttons/Checkmark/Checkmark.svg?react';
import FolderPlus from '@/assets/icons/projects/folderplus.svg?react';
import ArrowLeft from '@/assets/icons/directional/Arrows/Arrow Left.svg?react';
import { useCreateProject } from '@/features/Projects/hooks/customHooks';
import styles from './ProjectHeader.module.scss';
import ProjectSearchBar from '../ProjectSearchBar/ProjectSearchBar';

interface ProjectHeaderProps {
  title: string;
  subtitle?: string;
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  searchPlaceholder?: string;
  showBackButton?: boolean;
  backButtonText?: string;
  showCreateButton?: boolean;
  onCreateProject?: (projectName: string) => void;
  className?: string;
  variant?: 'detail' | 'list';
}

const ProjectHeader: FC<ProjectHeaderProps> = ({
  title,
  subtitle,
  searchTerm,
  setSearchTerm,
  searchPlaceholder = 'Search by Query Name',
  showBackButton = false,
  backButtonText = 'All Projects',
  showCreateButton = false,
  onCreateProject,
  className,
  variant = 'detail'
}) => {
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectNameError, setProjectNameError] = useState('');
  
  const createProjectMutation = useCreateProject();

  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      setSearchTerm(searchTerm);
    }, 500),
    [setSearchTerm]
  );

  const handleSearch = (value: string) => {
    if (value.length === 0) {
      setSearchTerm('');
    } else {
      if (variant === 'list') {
        debouncedSearch(value);
      } else {
        setSearchTerm(value);
      }
    }
  };

  const handleProjectSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleCreateNewClick();
  };

  const handleCreateNewClick = () => {
    if (isEditing) {
      // Handle Done Editing
      if (!projectName.trim()) {
        setProjectNameError('Project name is required');
        return;
      }
      
      if (onCreateProject) {
        onCreateProject(projectName.trim());
        setIsEditing(false);
        setProjectName('');
        setProjectNameError('');
      } else {
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
            console.error('Failed to create project:', error);
            setProjectNameError('Failed to create project. Please try again.');
          }
        });
      }
    } else {
      // Enter editing mode
      setIsEditing(true);
      setProjectName('');
      setProjectNameError('');
    }
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setProjectName('');
    setProjectNameError('');
  };

  const handleProjectNameChange = (value: string) => {
    setProjectName(value);
    if (projectNameError && value.trim()) {
      setProjectNameError('');
    }
  };

  return (
    <div className={`${styles.projectHeader} ${className || ''}`}>
      {variant === 'list' ? (
        // List variant layout
        <div className={styles.listLayout}>
          <div className={styles.top}>
            <div className={styles.titleSection}>
              <h1 className={styles.title}>{title}</h1>
              {showCreateButton && isEditing && (
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
              )}
              {showCreateButton && !isEditing && (
                <Button
                  iconLeft={<FolderPlus />}
                  handleClick={handleCreateNewClick}
                  small
                >
                  Create New
                </Button>
              )}
            </div>
            <div className={styles.right}>
              <ProjectSearchBar
                searchPlaceholder={searchPlaceholder}
                searchTerm={searchTerm}
                handleSearch={handleSearch}
                styles={styles}
              />
            </div>
          </div>
          {isEditing && (
            <div className={styles.editContainer}>
              <form onSubmit={handleProjectSubmit}>
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
              </form>
            </div>
          )}
        </div>
      ) : (
        // Detail variant layout
        <>
          <div className={styles.titleSection}>
            {showBackButton && (
              <Button 
                variant="secondary" 
                handleClick={() => navigate('/projects')}
                className={styles.backButton}
                iconLeft={<ArrowLeft />}
              >
                {backButtonText}
              </Button>
            )}
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <div className={styles.searchSection}>
            <ProjectSearchBar
              searchPlaceholder={searchPlaceholder}
              searchTerm={searchTerm}
              handleSearch={handleSearch}
              styles={styles}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectHeader; 