import { FC, FormEvent, useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import Button from '@/features/Core/components/Button/Button';
import TextInput from '@/features/Core/components/TextInput/TextInput';
import FolderPlus from '@/assets/icons/projects/folderplus.svg?react';
import ArrowLeft from '@/assets/icons/directional/Arrows/Arrow Left.svg?react';
import EditIcon from '@/assets/icons/buttons/Edit.svg?react';
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';
import RestoreIcon from '@/assets/icons/directional/Undo & Redo/Undo.svg?react';
import TrashIcon from '@/assets/icons/buttons/TrashFilled.svg?react';
import { useCreateProject, useUpdateProjects } from '@/features/Projects/hooks/customHooks';
import styles from './ProjectHeader.module.scss';
import ProjectSearchBar from '@/features/Projects/components/ProjectSearchBar/ProjectSearchBar';
import ProjectHeaderEditControlButtons from './ProjectHeaderEditControlButtons';
import { UserQueryObject, Project, ProjectEditingItem } from '@/features/Projects/types/projects';
import { isUnassignedProject } from '@/features/Projects/utils/editUpdateFunctions';

interface ProjectHeaderProps {
  backButtonText?: string;
  bookmarkCount?: number;
  className?: string;
  projectEditingItem?: ProjectEditingItem;
  isEditing: boolean;
  noteCount?: number;
  onCreateNewClick?: () => void;
  onCancelEdit?: () => void;
  onEditClick?: () => void;
  onRestoreProject?: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
  onRestoreQuery?: (query: UserQueryObject) => void;
  onDeleteQuery?: (query: UserQueryObject) => void;
  onUpdateProjectItem?: (id: number | string, name: string, queryIds: string[]) => void;
  project?: Project;
  queriesLoading?: boolean;
  searchPlaceholder?: string;
  searchTerm: string;
  selectedQueries: UserQueryObject[];
  setSearchTerm: (searchTerm: string) => void;
  setProjectEditingState: (isEditing: boolean, editingItem?: ProjectEditingItem) => void;
  showBackButton?: boolean;
  showCreateButton?: boolean;
  subtitle?: string;
  title: string;
  variant?: 'detail' | 'list';
}

const ProjectHeader: FC<ProjectHeaderProps> = ({
  backButtonText = 'All Projects',
  bookmarkCount,
  className,
  projectEditingItem,
  isEditing = false,
  noteCount,
  onCreateNewClick,
  onCancelEdit,
  onEditClick,
  onRestoreProject,
  onDeleteProject,
  onRestoreQuery,
  onDeleteQuery,
  onUpdateProjectItem,
  project,
  queriesLoading = false,
  searchPlaceholder = 'Search by Query Name',
  searchTerm,
  selectedQueries,
  setSearchTerm,
  setProjectEditingState,
  showBackButton = false,
  showCreateButton = false,
  subtitle,
  title,
  variant = 'detail'
}) => {
  const navigate = useNavigate();
  
  const [projectNameError, setProjectNameError] = useState('');
  const projectNameInputRef = useRef<HTMLInputElement>(null);
  const createProjectMutation = useCreateProject();
  const updateProjectsMutation = useUpdateProjects();
  const isUnassigned = isUnassignedProject(project || 0);

  // Focus and select text when editing starts
  useEffect(() => {
    if (isEditing && projectNameInputRef.current) {
      projectNameInputRef.current.focus();
      projectNameInputRef.current.select();
    }
  }, [isEditing]);

  // Clear error when editing starts
  useEffect(() => {
    if (isEditing && projectEditingItem) {
      setProjectNameError('');
    }
  }, [isEditing, projectEditingItem]);

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

  const handleCreateNewClick = () => {
    if (onCreateNewClick) {
      onCreateNewClick();
    } else {
      setProjectEditingState(true, {
        id: '',
        name: '',
        queryIds: [],
        type: 'project',
        status: 'new'
      });
    }
    setProjectNameError('');
  };

  const handleDoneClick = () => {
    if (isEditing) {
      const currentName = projectEditingItem?.name || '';
      
      // Handle Done Editing
      if (!currentName.trim()) {
        setProjectNameError('Name is required');
        return;
      }
      
      if (projectEditingItem && onUpdateProjectItem && projectEditingItem.status !== 'new') {
        // Update existing item
        onUpdateProjectItem(projectEditingItem.id, currentName.trim(), selectedQueries?.map(query => query.data.qid) || []);
        setProjectEditingState(false);
        setProjectNameError('');
      } else {
        // Create the project using the mutation
        createProjectMutation.mutate({
          title: currentName.trim(),
          pks: selectedQueries?.map(query => query.data.qid) || []
        }, {
          onSuccess: (data) => {
            // Reset form on successful creation
            setProjectEditingState(false);
            setProjectNameError('');
            navigate(`/projects/${data.id}`);
          },
          onError: (error) => {
            console.error('Failed to create project:', error);
            setProjectNameError('Failed to create project. Please try again.');
          }
        });
      }
    }
  };

  const handleDeleteClick = () => {
    if (onDeleteProject && project) {
      onDeleteProject(project);
    }
  };

  const handleCancelClick = () => {
    if (onCancelEdit)
      onCancelEdit();

    setProjectEditingState(false);
    setProjectNameError('');
  };

  const handleProjectNameChange = (value: string) => {
    if (projectEditingItem)
      setProjectEditingState(true, { ...projectEditingItem, name: value });
    if (projectNameError && value.trim())
      setProjectNameError('');
  };

  const getInputLabel = () => {
    if (projectEditingItem)
      return projectEditingItem.type === 'project' ? 'Project Name' : 'Query Name';
    return 'Project Name';
  };

  const getInputPlaceholder = () => {
    if (projectEditingItem)
      return projectEditingItem.type === 'project' ? 'Unnamed Project' : 'Unnamed Query';
    return 'Unnamed Project';
  };

  const handleEditClick = () => {
    if (onEditClick) {
      // Use the parent's edit handler if provided
      onEditClick();
    } else {
      // Fallback to local edit handling
      console.log('edit handler not provided');
      setProjectEditingState(true);
      if (variant === 'detail' && title) {
        // In detail view, we're editing the current project
        // The editingItem will be set by the parent component when needed
      }
    }
  };

  const handleRestoreProject = () => {
    if (onRestoreProject && project)
      onRestoreProject(project);
  };

  const handleDeleteProjectPermanently = () => {
    if (onDeleteProject && project)
      onDeleteProject(project);
  };

  const handleRestoreQuery = (query: UserQueryObject) => {
    if (onRestoreQuery && query)
      onRestoreQuery(query);
  };

  const handleDeleteQuery = (query: UserQueryObject) => { 
    if (onDeleteQuery && query)
      onDeleteQuery(query);
  };

  return (
    <div className={`${styles.projectHeader} ${className || ''}`}>
      {variant === 'list' ? (
        // List variant layout
        <div className={styles.listLayout}>
          <div className={styles.top}>
            <div className={styles.titleSection}>
              <h1 className={styles.title}>
                {isEditing && projectEditingItem?.status === 'new' ? 'New Project' : title}
              </h1>
              {showCreateButton && isEditing && (
                  <ProjectHeaderEditControlButtons
                    createProjectMutation={createProjectMutation}
                    updateProjectsMutation={updateProjectsMutation}
                    handleDoneClick={handleDoneClick}
                    handleCancelClick={handleCancelClick}
                    handleDeleteClick={handleDeleteClick}
                    styles={styles}
                    type="create"
                  />
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
                  label={getInputLabel()}
                  value={projectEditingItem?.name || ''}
                  handleChange={handleProjectNameChange}
                  error={!!projectNameError}
                  errorBottom
                  errorText={projectNameError}
                  className={styles.projectNameInput}
                  disabled={createProjectMutation.isPending}
                  placeholder={getInputPlaceholder()}
                  ref={projectNameInputRef}
                />
              </form>
            </div>
          )}
        </div>
      ) : (
        // Detail variant layout
        <div className={styles.detailLayout}>
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
            {
              isEditing 
                ? (
                  <div className={styles.editSection}>
                    {isEditing && (
                      <div className={styles.editContainer}>
                        <ProjectHeaderEditControlButtons
                          createProjectMutation={createProjectMutation}
                          handleDoneClick={handleDoneClick}
                          handleCancelClick={handleCancelClick}
                          handleDeleteClick={handleDeleteClick}
                          type="update"
                          styles={styles}
                          updateProjectsMutation={updateProjectsMutation}
                        />
                        <form onSubmit={handleProjectSubmit}>
                          <TextInput
                            label={getInputLabel()}
                            value={projectEditingItem?.name || ''}
                            handleChange={handleProjectNameChange}
                            error={!!projectNameError}
                            errorBottom
                            errorText={projectNameError}
                            className={styles.projectNameInput}
                            disabled={createProjectMutation.isPending}
                            placeholder={getInputPlaceholder()}
                            ref={projectNameInputRef}
                          />
                        </form>
                      </div>
                    )}
                  </div>
                )
                : (
                  <>
                    <div className={styles.subtitleSection}>
                      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                      {(bookmarkCount !== undefined && !isUnassigned) && <p className={styles.bookmarkCount}><BookmarkIcon />{bookmarkCount}</p>}
                      {(noteCount !== undefined && !isUnassigned) && <p className={styles.noteCount}><NoteIcon />{noteCount}</p>}
                    </div>
                    {
                      isUnassigned
                        ? null
                        : (
                          <div className={styles.editSection}>
                            <div className={styles.buttonContainer}>
                              {
                                (project && project.deleted) 
                                  ? 
                                    (
                                      <>
                                        <Button
                                          variant="secondary"
                                          handleClick={handleRestoreProject}
                                          className={`${styles.editButton} ${styles.restoreButton}`}
                                          iconLeft={<RestoreIcon />}
                                          small
                                        >
                                          Restore Project
                                        </Button>
                                        <Button
                                          variant="secondary"
                                          handleClick={handleDeleteProjectPermanently}
                                          className={styles.editButton}
                                          iconLeft={<TrashIcon />}
                                          small
                                        >
                                          Delete Permanently
                                        </Button>
                                      </>
                                    )
                                  : 
                                    (
                                      <Button
                                        variant="secondary"
                                        handleClick={handleEditClick}
                                        className={styles.editButton}
                                        iconLeft={<EditIcon />}
                                        small
                                        disabled={queriesLoading}
                                      >
                                        Edit
                                      </Button>
                                    )
                              }
                            </div>
                          </div>
                        )
                    }
                  </>
                )
            }
          </div>
          <div className={styles.searchSection}>
            <ProjectSearchBar
              searchPlaceholder={searchPlaceholder}
              searchTerm={searchTerm}
              handleSearch={handleSearch}
              styles={styles}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectHeader; 