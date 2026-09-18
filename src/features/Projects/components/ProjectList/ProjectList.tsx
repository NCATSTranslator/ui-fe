import { useEffect, useMemo, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import styles from "./ProjectList.module.scss";
import { useSelector } from "react-redux";
import { currentUser } from "@/features/UserAuth/slices/userSlice";
import LoadingWrapper from "@/features/Core/components/LoadingWrapper/LoadingWrapper";
import { useProjectListData } from "@/features/Projects/hooks/useProjectListData";
import Button from "@/features/Core/components/Button/Button";
import Plus from '@/assets/icons/buttons/Add/Add.svg?react';
import { useCreateProject, useSortSearchState } from "@/features/Projects/hooks/customHooks";
import { projectCreatedToast } from "@/features/Core/utils/toastMessages";
import ProjectCard from "@/features/Projects/components/ProjectCard/ProjectCard";
import ListHeader from "@/features/Core/components/ListHeader/ListHeader";
import Tab from "@/features/Core/components/Tabs/Tab";
import Tabs from "@/features/Core/components/Tabs/Tabs";
import ProjectsTableHeader from "../TableHeader/ProjectsTableHeader/ProjectsTableHeader";
import CardList from "@/features/Core/components/CardList/CardList";
import { useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";
import EmptyArea from "@/features/Projects/components/EmptyArea/EmptyArea";
import { getFormattedLoginURL } from "@/features/UserAuth/utils/userApi";
import type { Project, UserQueryObject } from "@/features/Projects/types/projects";

type ProjectCardsArgs = {
  projects: Project[];
  searchTerm: string;
  activeQueries: UserQueryObject[];
  queriesLoading: boolean;
  newProjectId: number | null;
  onRename: () => void;
  onCreateNew: () => void;
  onToggleQueries: () => void;
};

const renderProjectCards = ({
  projects,
  searchTerm,
  activeQueries,
  queriesLoading,
  newProjectId,
  onRename,
  onCreateNew,
  onToggleQueries,
}: ProjectCardsArgs): ReactNode => {
  if (projects.length === 0 && searchTerm) {
    return (
      <EmptyArea>
        <p>No projects found matching your search.</p>
      </EmptyArea>
    );
  }
  if (projects.length === 0) {
    return (
      <EmptyArea heading="No Projects">
        <p>
          <Button handleClick={onCreateNew} title="Create New Project" variant="textOnly" inline>Create New Project</Button>
          {' '}to start organizing your queries.<br/>
          You can also add queries to a new project from the{' '}
          <Button handleClick={onToggleQueries} title="Queries" variant="textOnly" inline>Queries</Button> tab.
        </p>
      </EmptyArea>
    );
  }
  return projects.map((project) => (
    <ProjectCard
      key={project.id}
      activeQueries={activeQueries}
      queriesLoading={queriesLoading}
      project={project}
      allProjects={projects}
      searchTerm={searchTerm}
      startRenaming={newProjectId === project.id}
      onRename={onRename}
    />
  ));
};

const ProjectList = () => {
  const location = useLocation();
  const user = useSelector(currentUser);
  const sortSearchState = useSortSearchState();
  const data = useProjectListData(sortSearchState);
  const projects = useMemo(() => data.formatted.active, [data.formatted.active]);
  const projectsLoading = data.loading.projectsLoading;
  const queriesLoading = data.loading.queriesLoading;
  const createProjectMutation = useCreateProject();
  const [newProjectId, setNewProjectId] = useState<number | null>(null);
  const { togglePanel, activePanelId, closePanel } = useSidebar();
  const activeQueries = useMemo(() => data.filtered.active.queries || [], [data.filtered.active.queries]);
  const shouldShowErrorState = !user?.id && !projectsLoading && projects.length === 0;
  const projectsTabHeading = `${projects.length} Project${projects.length === 1 ? '' : 's'}`;

  const handleCreateNewProjectClick = () => {
    createProjectMutation.mutate({ title: '', pks: [] }, {
      onSuccess: (created) => {
        projectCreatedToast();
        setNewProjectId(created.id);
      },
      onError: (error) => {
        console.error('Failed to create project:', error);
      },
    });
  };

  // Close the projects sidebar panel while viewing the full projects page.
  useEffect(() => {
    if (activePanelId === 'projects') closePanel();
  }, [activePanelId, closePanel]);

  return (
    <div className={styles.projectsPanel}>
      <ListHeader
        heading="Projects"
        searchPlaceholder="Search Projects"
        searchTerm={sortSearchState.searchTerm}
        handleSearch={sortSearchState.handleSearch}
      />
      <div className={styles.list}>
        {shouldShowErrorState ? (
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
              handleTabSelection={() => {}}
              defaultActiveTab={projectsTabHeading}
              className={styles.projectTabs}
              activeTab={projectsTabHeading}
              controlled
            >
              {[
                <Tab key="projects" heading={projectsTabHeading} className={styles.projectTabContent}>
                  <CardList>
                    <ProjectsTableHeader sortSearchState={sortSearchState} />
                    {renderProjectCards({
                      projects,
                      searchTerm: sortSearchState.searchTerm,
                      activeQueries,
                      queriesLoading,
                      newProjectId,
                      onRename: () => setNewProjectId(null),
                      onCreateNew: handleCreateNewProjectClick,
                      onToggleQueries: () => togglePanel('queries'),
                    })}
                  </CardList>
                </Tab>,
              ]}
            </Tabs>
          </LoadingWrapper>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
