import { FC, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import styles from "./SidebarProjectList.module.scss";
import { useSelector } from "react-redux";
import { currentUser } from "@/features/UserAuth/slices/userSlice";
import TextInput from "@/features/Core/components/TextInput/TextInput";
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import SidebarProjectCard from "@/features/Sidebar/components/SidebarProjectCard/SidebarProjectCard";
import LoadingWrapper from "@/features/Common/components/LoadingWrapper/LoadingWrapper";
import { useProjectListData } from "@/features/Projects/hooks/useProjectListData";
import Button from "@/features/Core/components/Button/Button";
import PlusIcon from '@/assets/icons/buttons/Add/Add.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import { useCreateProject, useSortSearchState } from "@/features/Projects/hooks/customHooks";
import { queryAddedToProjectToast } from "@/features/Core/utils/toastMessages";
import { useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";
import { useGetQueryCardTitle } from "@/features/Projects/hooks/customHooks";
import { Project } from "@/features/Projects/types/projects";
import { getFormattedLoginURL } from "@/features/UserAuth/utils/userApi";
import { joinClasses } from "@/features/Common/utils/utilities";

interface SidebarProjectListProps {
  className?: string;
}

const SidebarProjectList: FC<SidebarProjectListProps> = ({
  className = ''
}) => {

  const location = useLocation();
  const user = useSelector(currentUser);
  const sortSearchState = useSortSearchState();
  const data = useProjectListData(sortSearchState);
  const projects = useMemo(() => data.formatted.active || [], [data.formatted.active]);
  const projectsLoading = data.loading.projectsLoading;
  const createProjectMutation = useCreateProject();
  const [newProjectId, setNewProjectId] = useState<number | null>(null);
  const { addToProjectQuery, clearAddToProjectMode } = useSidebar();
  const { title: queryTitle } = useGetQueryCardTitle(addToProjectQuery || null);
  const { projectId } = useParams<{ projectId: string }>();
  const activeProjectId = projectId ? Number(projectId) : null;

  const handleCreateNewProjectClick = () => {
    const newProject = {
      title: '',
      pks: addToProjectQuery !== null ? [addToProjectQuery.data.qid] : []
    };

    createProjectMutation.mutate(newProject, {
      onSuccess: (data) => {
        setNewProjectId(data.id);
      },
      onError: (error) => {
        console.error('Failed to create project:', error);
      }
    });
  };

  const handleRenameProject = (project: Project) => {
    setNewProjectId(null);
    if (!addToProjectQuery || !project) return;

    // If in add-to-project mode and this was the new project being named
    queryAddedToProjectToast(queryTitle, project.data.title);
    clearAddToProjectMode();
  };

  return (
    <div className={joinClasses(styles.sidebarProjectList, className)}>
      <div className={styles.top}>
        <TextInput
          iconLeft={<SearchIcon />}
          iconRight={sortSearchState.searchTerm.length > 0 && <CloseIcon />}
          iconRightClickToReset
          handleChange={sortSearchState.handleSearch}
          placeholder="Search Projects"
        />
      </div>
      <div className={styles.list}>
        {
          !user ? (
            <div className={styles.empty}>
              <p>
                <a href={getFormattedLoginURL(location)} className={styles.link}>Log in</a> to view your saved projects.
              </p>
            </div>
          ) : (
            <LoadingWrapper loading={projectsLoading} contentClassName={styles.projectsList}>
              <Button 
                iconLeft={<PlusIcon />}
                handleClick={handleCreateNewProjectClick}
                title="Create New Project"
                className={styles.createNewProjectButton}
              >
                Create New Project
              </Button>
              {projects.map((project) => (
                <SidebarProjectCard
                  key={project.id}
                  isActiveProject={activeProjectId === project.id}
                  project={project}
                  allProjects={projects}
                  searchTerm={sortSearchState.searchTerm}
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

export default SidebarProjectList;