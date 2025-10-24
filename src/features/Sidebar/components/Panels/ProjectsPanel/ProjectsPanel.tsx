import { useMemo, useState } from "react";
import styles from "./ProjectsPanel.module.scss";
import { useSelector } from "react-redux";
import { currentUser } from "@/features/UserAuth/slices/userSlice";
import TextInput from "@/features/Core/components/TextInput/TextInput";
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import SidebarProjectCard from "@/features/Sidebar/components/SidebarProjectCard/SidebarProjectCard";
import LoadingWrapper from "@/features/Common/components/LoadingWrapper/LoadingWrapper";
import { useProjectListData } from "@/features/Projects/hooks/useProjectListData";
import { useSimpleSearch } from "@/features/Common/hooks/simpleSearchHook";
import Button from "@/features/Core/components/Button/Button";
import Plus from '@/assets/icons/buttons/Add/Add.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import { useCreateProject } from "@/features/Projects/hooks/customHooks";
import { projectCreatedToast } from "@/features/Projects/utils/toastMessages";

const ProjectsPanel = () => {
  const user = useSelector(currentUser);
  const data = useProjectListData();
  const projects = useMemo(() => data.formatted.active, [data.formatted.active]);
  const projectsLoading = data.loading.projectsLoading;
  const { searchTerm, handleSearch } = useSimpleSearch();
  const createProjectMutation = useCreateProject();
  const [newProjectId, setNewProjectId] = useState<number | null>(null);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => project.data.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [projects, searchTerm]);

  const handleCreateNewProjectClick = () => {
    const newProject = {
      title: '',
      pks: []
    };

    createProjectMutation.mutate(newProject, {
      onSuccess: (data) => {
        projectCreatedToast();
        setNewProjectId(data.id);
      },
      onError: (error) => {
        console.error('Failed to create project:', error);
      }
    });
  };

  const handleRenameProject = () => {
    setNewProjectId(null);
  };

  return (
    <div className={styles.projectsPanel}>
      <div className={styles.top}>
        <TextInput
          iconLeft={<SearchIcon />}
          iconRight={searchTerm.length > 0 && <CloseIcon />}
          iconRightClickToReset
          handleChange={handleSearch}
          placeholder="Search Projects"
        />
      </div>
      <div className={styles.list}>
        {
          !user ? (
            <div className={styles.empty}>
              <p>
                <a href="/login" className={styles.link}>Log in</a> to view your saved projects.
              </p>
            </div>
          ) : (
            <LoadingWrapper loading={projectsLoading} contentClassName={styles.projectsList}>
              <Button 
                iconLeft={<Plus />}
                handleClick={handleCreateNewProjectClick}
                title="Create New Project"
                className={styles.createNewProjectButton}
              >
                Create New Project
              </Button>
              {filteredProjects.map((project) => (
                <SidebarProjectCard 
                  key={project.id}
                  project={project}
                  allProjects={projects}
                  searchTerm={searchTerm}
                  startRenaming={newProjectId === project.id}
                  onRename={handleRenameProject}
                />
              ))}
            </LoadingWrapper>
          )
        }
      </div>
    </div>
  );
};

export default ProjectsPanel;