import { FC, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import styles from "./EditQueryModal.module.scss";
import Modal from "@/features/Common/components/Modal/Modal";
import TextInput from "@/features/Core/components/TextInput/TextInput";
import { ProjectCreate, ProjectRaw, ProjectUpdate, QueryEditingItem, UserQueryObject } from "@/features/Projects/types/projects";
import Button from "@/features/Core/components/Button/Button";
import { useCreateProject } from "@/features/Projects/hooks/customHooks";
import { useDeletePrompts } from "@/features/Projects/hooks/useDeletePrompts";
import CheckmarkIcon from '@/assets/icons/buttons/Checkmark/Checkmark.svg?react';
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import TrashIcon from '@/assets/icons/buttons/TrashFilled.svg?react';
import { debounce } from "lodash";
import LoadingWrapper from "@/features/Common/components/LoadingWrapper/LoadingWrapper";
import Highlighter from "react-highlight-words";
import { filterProjects } from "@/features/Projects/utils/filterAndSortingFunctions";
import { projectCreatedToast } from "@/features/Core/utils/toastMessages";
import { useEditProjectHandlers, useEditQueryHandlers } from "@/features/Projects/utils/editUpdateFunctions";
import WarningModal from "@/features/Common/components/WarningModal/WarningModal";
import { getProjectQueryCount } from "@/features/Projects/utils/utilities";

const getAttachedProjects = (projects: ProjectRaw[], queryId?: string) => {
  return projects.filter(p => queryId && p.data.pks.includes(queryId));
}

interface EditQueryModalProps {
  activeQueries: UserQueryObject[];
  currentEditingQueryItem?: QueryEditingItem;
  handleClose?: () => void;
  isOpen: boolean;
  loading: boolean;
  mode: 'edit' | 'add';
  projects: ProjectRaw[];
  setSelectedProject?: (projects: ProjectRaw) => void;
}

const EditQueryModal: FC<EditQueryModalProps> = ({
  activeQueries,
  handleClose = () => {},
  isOpen,
  loading,
  mode = 'edit',
  projects,
  currentEditingQueryItem,
  setSelectedProject,
  }) => {
  
  const heading = mode === 'edit' ? 'Edit Query' : 'Add to Project';
  const subheadingOne = mode === 'edit' ? 'Add to New Project' : 'Create New';
  const subheadingTwo = 'Your Projects';
  const [open, setOpen] = useState(isOpen);
  const [newProject, setNewProject] = useState<ProjectCreate | null>(null);
  const [projectNameError, setProjectNameError] = useState('');
  const createProjectMutation = useCreateProject();

  const { handleUpdateProject } = useEditProjectHandlers();
  const { handleDeleteQuery } = useEditQueryHandlers(undefined, activeQueries);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDeleteQueryPromptOpen, setIsDeleteQueryPromptOpen] = useState(false);
  const filteredProjects: ProjectRaw[] = useMemo(() => filterProjects(projects.filter(p => !p.deleted), searchTerm) as ProjectRaw[], [projects, searchTerm]);
  const [localSelectedProjects, setLocalSelectedProjects] = useState<ProjectRaw[]>(getAttachedProjects(filteredProjects, currentEditingQueryItem?.pk));

  const deletePrompts = useDeletePrompts(['deleteQueries']);
  const { shouldShow, setHideDeletePrompt: setHideDeleteQueryPrompt } = deletePrompts.deleteQueries || {};

  const onClose = () => {
    setOpen(false);
    handleClose();
  }

  const handleSelectProject = (project: ProjectRaw) => {
    if(mode === 'add' && setSelectedProject) {
      setSelectedProject(project);
      onClose();
    } else {
      if(localSelectedProjects.some(p => p.id === project.id)) {
        setLocalSelectedProjects(prev => prev.filter(p => p.id !== project.id));
      } else {
        setLocalSelectedProjects(prev => [...prev, project]);
      }
    }
  }

  const handleProjectNameChange = (value: string) => {
    setNewProject({
      title: value,
      pks: currentEditingQueryItem?.pk ? [currentEditingQueryItem.pk] : []
    });
  }

  const handleNewProjectFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleNewProjectSubmit();
  }

  const handleNewProjectSubmit = () => {
    if (!newProject?.title?.trim()) {
      setProjectNameError('Project Name is required');
      return;
    }

    createProjectMutation.mutate(newProject, {
      onSuccess: (data) => {
        // Reset form on successful creation
        setNewProject(null);
        setProjectNameError('');
        if(mode === 'add' && setSelectedProject) {
          setSelectedProject(data);
          onClose();
        } else {
          setLocalSelectedProjects([...localSelectedProjects, data]);
        }
        projectCreatedToast();
        // onClose();
      },
      onError: (error) => {
        console.error('Failed to create project:', error);
        setProjectNameError('Failed to create project. Please try again.');
      }
    });
  }

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
      debouncedSearch(value);
    }
  };

  const handleInitiateDeleteQuery = () => {
    if(shouldShow)
      setIsDeleteQueryPromptOpen(true);
    else {
      findAndCallDeleteQuery();
    }
  }

  const findAndCallDeleteQuery = () => {
    const query = activeQueries.find(q => q.data.qid === currentEditingQueryItem?.pk);
    if(query)
      handleDeleteQuery(query);
    else 
      console.warn("query not found, unable to delete");
  }

  const handleSaveQuery = () => {
    if(!currentEditingQueryItem?.pk) 
      return;

    // get all selected projects that do not have the current query id in their pks, then add the query id to their pks
    const projectsToAddQueryTo: ProjectUpdate[] = localSelectedProjects.filter(p => !p.data.pks.includes(currentEditingQueryItem.pk)).map(p => {
      return {
        id: p.id,
        title: p.data.title,
        pks: [...p.data.pks, currentEditingQueryItem.pk]
      }
    });
    // get allprojects that have the currentEditingQueryItem.pk in their pks
    const attachedProjects = getAttachedProjects(projects, currentEditingQueryItem.pk);
    // get allprojects that have the current query attached but aren't in the localSelectedProjects array, then remove the query id from their pks
    const projectsToRemoveQueryFrom: ProjectUpdate[] = attachedProjects.filter(p => !localSelectedProjects.some(lp => lp.id === p.id)).map(p => {
      return {
        id: p.id,
        title: p.data.title,
        pks: p.data.pks.filter(pk => pk !== currentEditingQueryItem.pk)
      }
    });

    const projectsToUpdate: ProjectUpdate[] = [...projectsToAddQueryTo, ...projectsToRemoveQueryFrom];
    for(const project of projectsToUpdate) {
      handleUpdateProject(project.id, project.title || undefined, project.pks);
    }
  }

  const handleCancel = () => {
    onClose();
  }

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if(currentEditingQueryItem)
      setLocalSelectedProjects(getAttachedProjects(filteredProjects, currentEditingQueryItem?.pk));
  }, [currentEditingQueryItem, filteredProjects]);

  return (
    <>
      <Modal
        isOpen={open}
        onClose={onClose}
        className={styles.editQueryModal}
        containerClass={styles.container}
        innerClass={styles.modalInner}
      >
        <div className={styles.top}>
          <div className={styles.header}>
            <h5 className={styles.heading}>{heading}</h5>
          </div>
          <div className={styles.inner}>
            <h6 className={styles.subheading}>{subheadingOne}</h6>
            <div className={`${styles.newProject} ${styles.wrapper}`}>
              <div className={styles.newProjectForm}>
                <form onSubmit={handleNewProjectFormSubmit}>
                  <TextInput
                    placeholder="Enter a Project Name"
                    value={newProject?.title || ''}
                    handleChange={handleProjectNameChange}
                    error={!!projectNameError}
                    errorText={projectNameError}
                    containerClassName={styles.projectNameInputContainer}
                  />
                  <Button
                    iconOnly
                    iconLeft={<CheckmarkIcon />}
                    handleClick={handleNewProjectSubmit}
                    disabled={createProjectMutation.isPending}
                    small
                    className={styles.createButton}
                  />
                </form>
              </div>
            </div>
          </div>
          <div className={styles.inner}>
            <h6 className={styles.subheading}>{subheadingTwo}</h6>
            <div className={`${styles.projectList} ${styles.wrapper}`}>
              <div className={styles.projectSearch}>
                <TextInput
                  placeholder="Search Projects"
                  iconLeft={<SearchIcon />}
                  iconRight={searchTerm.length > 0 ? <CloseIcon onClick={() => setSearchTerm('')} className={styles.clearSearchIcon}/> : null}
                  iconRightClickToReset={searchTerm.length > 0}
                  handleChange={handleSearch}
                />
              </div>
              <div className={styles.projectListInner}>
                <LoadingWrapper
                  loading={loading}
                >
                  {
                    filteredProjects.length > 0 ? filteredProjects.map((project) => {
                      const projectName = project.label || project.data.title;
                      const isSelected = mode === "edit" && localSelectedProjects.some(p => p.id === project.id);
                      const queryCount = getProjectQueryCount(project, activeQueries);
                      return(
                        <div
                          className={`${styles.projectItem} ${isSelected ? styles.selected : ''}`}
                          key={project.id} 
                          onClick={() => handleSelectProject(project)}
                          >
                          <Highlighter
                            highlightClassName="highlight"
                            className={styles.projectName}
                            searchWords={searchTerm ? [searchTerm] : []}
                            autoEscape={true}
                            textToHighlight={projectName}
                          />
                          <div className={styles.queryCount}>{queryCount} quer{queryCount === 1 ? 'y' : 'ies'}</div>
                        </div>
                    )}) : (
                      <div className={styles.noResults}>
                        {
                          searchTerm.length > 0 ? (
                            <p>No projects found matching "{searchTerm}"</p>
                          ) : (
                            <p>No projects found</p>
                          )
                        }
                      </div>
                    )
                  }
                </LoadingWrapper>
              </div>
            </div>
          </div>
        </div>
        {
          mode === 'edit' && (
            <div className={styles.bottom}>
                <div className="left">
                  <Button
                    variant="secondary"
                    handleClick={handleInitiateDeleteQuery}
                    iconLeft={<TrashIcon />}
                    className={`${styles.button} ${styles.deleteButton}`}
                    small
                  >
                    Delete Query
                  </Button>
                </div>
                <div className={styles.right}>                
                  <Button
                    variant="secondary"
                    handleClick={handleCancel}
                    iconLeft={<CloseIcon />}
                    className={styles.button}
                    small
                  >
                    Cancel
                  </Button>
                  <Button
                    handleClick={handleSaveQuery}
                    iconLeft={<CheckmarkIcon />}
                    className={`${styles.button} ${styles.saveButton}`}
                    small
                  >
                    Save
                  </Button>
                </div>
              </div>
            )
          }
      </Modal>
      <WarningModal
        isOpen={isDeleteQueryPromptOpen}
        onClose={() => setIsDeleteQueryPromptOpen(false)}
        onConfirm={findAndCallDeleteQuery}
        onCancel={() => setIsDeleteQueryPromptOpen(false)}
        cancelButtonText="Cancel"
        confirmButtonText="Delete Query"
        content="This query, along with any bookmarks or notes associated with it, can be recovered from your Trash."
        heading="Delete Query?"
        setStorageKeyFn={setHideDeleteQueryPrompt}
      />
    </>
  );
};

export default EditQueryModal;