import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import styles from "./ProjectList.module.scss";
import { useSelector } from "react-redux";
import { currentUser } from "@/features/UserAuth/slices/userSlice";
import LoadingWrapper from "@/features/Common/components/LoadingWrapper/LoadingWrapper";
import { useProjectListData } from "@/features/Projects/hooks/useProjectListData";
import Button from "@/features/Core/components/Button/Button";
import Plus from '@/assets/icons/buttons/Add/Add.svg?react';
import { useCreateProject, useSortSearchState } from "@/features/Projects/hooks/customHooks";
import { projectCreatedToast } from "@/features/Core/utils/toastMessages";
import ProjectCard from "@/features/Projects/components/ProjectCard/ProjectCard";
import ListHeader from "@/features/Core/components/ListHeader/ListHeader";
import Tab from "@/features/Common/components/Tabs/Tab";
import Tabs from "@/features/Common/components/Tabs/Tabs";
import ProjectsTableHeader from "../TableHeader/ProjectsTableHeader/ProjectsTableHeader";
import CardList from "@/features/Projects/components/CardList/CardList";
import { useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";
import EmptyArea from "@/features/Projects/components/EmptyArea/EmptyArea";
import { getFormattedLoginURL } from "@/features/UserAuth/utils/userApi";

const ProjectList = () => {
  const location = useLocation();
  const user = useSelector(currentUser);
  // Sort/Search state management
  const sortSearchState = useSortSearchState();
  const data = useProjectListData(sortSearchState);
  const projects = useMemo(() => data.formatted.active, [data.formatted.active]);
  const projectsLoading = data.loading.projectsLoading;
  const createProjectMutation = useCreateProject();
  const [newProjectId, setNewProjectId] = useState<number | null>(null);
  const { togglePanel } = useSidebar();

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

  const projectsTabHeading = useMemo(() => {
    // subtract 1 to account for the unassigned project
    const projectCount = projects.length - 1;
    return `${projectCount >= 0 ? projectCount : '0'} Project${projectCount === 1 ? '' : 's'}`;
  }, [projects]);

  return (
    <div className={styles.projectsPanel}>
      <ListHeader
        heading="Projects"
        searchPlaceholder="Search Projects"
        searchTerm={sortSearchState.searchTerm}
        handleSearch={sortSearchState.handleSearch}
      />
      <div className={styles.list}>
        {
          !user ? (
            <EmptyArea>
              <p>
                <a href={getFormattedLoginURL(location)} className={styles.link}>Log in</a> to view your saved projects.
              </p>
            </EmptyArea>
          ) : (
            <LoadingWrapper loading={projectsLoading} contentClassName={styles.projectList}>
              <Button 
                iconLeft={<Plus />}
                handleClick={handleCreateNewProjectClick}
                title="Create New Project"
                className={styles.createNewProjectButton}
                variant="textOnly"
              >
                Create New Project
              </Button>
              <Tabs
                isOpen={true}
                handleTabSelection={() => {}}
                defaultActiveTab={projectsTabHeading}
                className={styles.projectTabs}
                activeTab={projectsTabHeading}
                controlled
              >
                {[
                  <Tab key="projects" heading={projectsTabHeading} className={styles.projectTabContent}>
                    <CardList>
                      <ProjectsTableHeader
                        sortSearchState={sortSearchState}
                      />
                      {
                        projects.length === 0 
                        ? (
                          <EmptyArea>
                            <p>No projects found matching your search.</p>
                          </EmptyArea>
                        ) 
                        : projects.length === 1
                          ? 
                            (
                              <EmptyArea heading="No Projects">
                                <p>
                                  <Button handleClick={handleCreateNewProjectClick} title="Create New Project" variant="textOnly" inline>Create New Project</Button> to start organizing your queries.<br/>
                                  You can also add queries to a new project from the <Button handleClick={() => togglePanel('queries')} title="Queries" variant="textOnly" inline>Queries</Button> tab.
                                </p>
                              </EmptyArea>
                            )
                          : 
                            projects.map((project) => (
                              <ProjectCard
                                key={project.id}
                                project={project}
                                allProjects={projects}
                                searchTerm={sortSearchState.searchTerm}
                                startRenaming={newProjectId === project.id}
                                onRename={handleRenameProject}
                              />
                            ))
                      }
                    </CardList>
                  </Tab>
                ]}
              </Tabs>
            </LoadingWrapper>
          )
        }
      </div>
    </div>
  );
};

export default ProjectList;