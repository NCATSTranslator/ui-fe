import { FC, FormEvent, useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import Button from '@/features/Core/components/Button/Button';
import TextInput from '@/features/Core/components/TextInput/TextInput';
import FolderPlus from '@/assets/icons/projects/folderplus.svg?react';
import ArrowLeft from '@/assets/icons/directional/Arrows/Arrow Left.svg?react';
import { useCreateProject, useUpdateProjects } from '@/features/Projects/hooks/customHooks';
import styles from './ProjectHeader.module.scss';
import ProjectSearchBar from '../ProjectSearchBar/ProjectSearchBar';
import EditIcon from '@/assets/icons/buttons/Edit.svg?react';
import ProjectHeaderEditControlButtons from './ProjectHeaderEditControlButtons';

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
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  editingItem?: { id: number | string; name: string; type: 'project' | 'query' };
  onUpdateItem?: (id: number | string, newName: string, type: 'project' | 'query') => void;
  onCancelEdit?: () => void;
  onEditClick?: () => void;
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
  variant = 'detail',
  isEditing = false,
  setIsEditing,
  editingItem,
  onUpdateItem,
  onCancelEdit,
  onEditClick
}) => {
  const navigate = useNavigate();
  
  const [projectName, setProjectName] = useState('');
  const [projectNameError, setProjectNameError] = useState('');
  
  const createProjectMutation = useCreateProject();
  const updateProjectsMutation = useUpdateProjects();

  // Initialize project name when editing an existing item
  useEffect(() => {
    if (isEditing && editingItem) {
      setProjectName(editingItem.name);
      setProjectNameError('');
    } else if (isEditing && !editingItem) {
      setProjectName('');
      setProjectNameError('');
    }
  }, [isEditing, editingItem]);

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
    handleDoneClick();
  };

  const handleDoneClick = () => {
    if (isEditing) {
      // Handle Done Editing
      if (!projectName.trim()) {
        setProjectNameError('Name is required');
        return;
      }
      
      if (editingItem && onUpdateItem) {
        // Update existing item
        onUpdateItem(editingItem.id, projectName.trim(), editingItem.type);
        setIsEditing(false);
        setProjectName('');
        setProjectNameError('');
      } else if (onCreateProject) {
        // Create new project
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
    if (onCancelEdit) {
      onCancelEdit();
    }
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

  const getInputLabel = () => {
    if (editingItem) {
      return editingItem.type === 'project' ? 'Project Name' : 'Query Name';
    }
    return 'Project Name';
  };

  const getInputPlaceholder = () => {
    if (editingItem) {
      return editingItem.type === 'project' ? 'Unnamed Project' : 'Unnamed Query';
    }
    return 'Unnamed Project';
  };

  const handleEditClick = () => {
    if (onEditClick) {
      // Use the parent's edit handler if provided
      console.log('edit handler provided');
      onEditClick();
    } else {
      // Fallback to local edit handling
      setIsEditing(true);
      if (variant === 'detail' && title) {
        // In detail view, we're editing the current project
        // The editingItem will be set by the parent component when needed
      }
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
                  <ProjectHeaderEditControlButtons
                    createProjectMutation={createProjectMutation}
                    updateProjectsMutation={updateProjectsMutation}
                    handleDoneClick={handleDoneClick}
                    handleCancelClick={handleCancelClick}
                    styles={styles}
                    type="create"
                  />
                )}
              {showCreateButton && !isEditing && (
                <Button
                  iconLeft={<FolderPlus />}
                  handleClick={handleDoneClick}
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
                  label={getInputLabel()}
                  value={projectName}
                  handleChange={handleProjectNameChange}
                  error={!!projectNameError}
                  errorBottom
                  errorText={projectNameError}
                  className={styles.projectNameInput}
                  disabled={createProjectMutation.isPending}
                  placeholder={getInputPlaceholder()}
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
            <Button
              variant="secondary"
              handleClick={handleEditClick}
              className={styles.editButton}
              iconLeft={<EditIcon />}
              small
            >
              Edit
            </Button>
            {isEditing && (
              <div className={styles.editContainer}>
                <form onSubmit={handleProjectSubmit}>
                  <TextInput
                    label={getInputLabel()}
                    value={projectName}
                    handleChange={handleProjectNameChange}
                    error={!!projectNameError}
                    errorBottom
                    errorText={projectNameError}
                    className={styles.projectNameInput}
                    disabled={createProjectMutation.isPending}
                    placeholder={getInputPlaceholder()}
                  />
                </form>
                <ProjectHeaderEditControlButtons
                  createProjectMutation={createProjectMutation}
                  handleDoneClick={handleDoneClick}
                  handleCancelClick={handleCancelClick}
                  type="update"
                  styles={styles}
                  updateProjectsMutation={updateProjectsMutation}
                />
              </div>
            )}
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