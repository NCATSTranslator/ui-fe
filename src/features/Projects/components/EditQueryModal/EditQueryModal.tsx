import { FC, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import styles from "./EditQueryModal.module.scss";
import Modal from "@/features/Common/components/Modal/Modal";
import TextInput from "@/features/Core/components/TextInput/TextInput";
import { ProjectCreate, ProjectRaw, QueryEditingItem } from "@/features/Projects/types/projects";
import Button from "@/features/Core/components/Button/Button";
import { useCreateProject } from "@/features/Projects/hooks/customHooks";
import CheckmarkIcon from '@/assets/icons/buttons/Checkmark/Checkmark.svg?react';
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import TrashIcon from '@/assets/icons/buttons/TrashFilled.svg?react';
import { debounce } from "lodash";
import LoadingWrapper from "@/features/Common/components/LoadingWrapper/LoadingWrapper";
import Highlighter from "react-highlight-words";
import { filterProjects } from "@/features/Projects/utils/filterAndSortingFunctions";
import { projectCreatedToast } from "@/features/Projects/utils/toastMessages";
import { isUnassignedProject } from "@/features/Projects/utils/editUpdateFunctions";

const getAttachedProjects = (projects: ProjectRaw[], queryId?: string) => {
  return projects.filter(p => queryId && p.data.pks.includes(queryId));
}

interface EditQueryModalProps {
  currentEditingQueryItem?: QueryEditingItem;
  handleClose?: () => void;
  isOpen: boolean;
  loading: boolean;
  mode: 'edit' | 'add';
  projects: ProjectRaw[];
  setSelectedProject?: (projects: ProjectRaw) => void;
}

const EditQueryModal: FC<EditQueryModalProps> = ({
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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [localSelectedProjects, setLocalSelectedProjects] = useState<ProjectRaw[]>(getAttachedProjects(projects, currentEditingQueryItem?.id));

  const filteredProjects: ProjectRaw[] = useMemo(() => filterProjects(projects, searchTerm) as ProjectRaw[], [projects, searchTerm]);

  const onClose = () => {
    setOpen(false);
    handleClose();
  }

  const handleSelectProject = (project: ProjectRaw) => {
    if(mode === 'add' && setSelectedProject) {
      setSelectedProject(project);
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
      pks: []
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
        } else {
          setLocalSelectedProjects([...localSelectedProjects, data]);
        }
        projectCreatedToast();
        onClose();
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

  const handleDeleteQuery = () => {
    console.log('delete query');
  }

  const handleSaveQuery = () => {
    console.log('save query');
    console.log(currentEditingQueryItem, localSelectedProjects);
  }

  const handleCancel = () => {
    onClose();
  }

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if(currentEditingQueryItem) {
      setLocalSelectedProjects(getAttachedProjects(projects, currentEditingQueryItem?.id));
    }
  }, [currentEditingQueryItem, projects]);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className={styles.editQueryModal}
      containerClass={styles.container}
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
                    const isUnassigned = isUnassignedProject(project);
                    if(isUnassigned) return null;
                    const projectName = project.label || project.data.title;
                    const isSelected = mode === "edit" && localSelectedProjects.some(p => p.id === project.id);
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
                        <div className={styles.queryCount}>{project.data.pks.length} quer{project.data.pks.length === 1 ? 'y' : 'ies'}</div>
                      </div>
                  )}) : (
                    <div className={styles.noResults}>
                      <p>No projects found matching "{searchTerm}"</p>
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
                  handleClick={handleDeleteQuery}
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
  );
};

export default EditQueryModal;