import { useMemo, useState } from "react";
import styles from "./ProjectList.module.scss";
import { useSelector } from "react-redux";
import { currentUser } from "@/features/UserAuth/slices/userSlice";
import LoadingWrapper from "@/features/Common/components/LoadingWrapper/LoadingWrapper";
import { useProjectListData } from "@/features/Projects/hooks/useProjectListData";
import { useSimpleSearch } from "@/features/Common/hooks/simpleSearchHook";
import Button from "@/features/Core/components/Button/Button";
import Plus from '@/assets/icons/buttons/Add/Add.svg?react';
import { useCreateProject, useSortSearchState } from "@/features/Projects/hooks/customHooks";
import { projectCreatedToast } from "@/features/Projects/utils/toastMessages";
import ProjectCard from "@/features/Projects/components/ProjectCard/ProjectCard";
import ListHeader from "@/features/Core/components/ListHeader/ListHeader";
import Tab from "@/features/Common/components/Tabs/Tab";
import Tabs from "@/features/Common/components/Tabs/Tabs";
import ProjectsTableHeader from "../TableHeader/ProjectsTableHeader/ProjectsTableHeader";
import CardList from "@/features/Projects/components/CardList/CardList";

const ProjectList = () => {
  const user = useSelector(currentUser);
  const data = useProjectListData();
  const projects = useMemo(() => data.formatted.active, [data.formatted.active]);
  const projectsLoading = data.loading.projectsLoading;
  const { searchTerm, handleSearch } = useSimpleSearch();
  const createProjectMutation = useCreateProject();
  const [newProjectId, setNewProjectId] = useState<number | null>(null);

  // Sort/Search state management
  const sortSearchState = useSortSearchState();

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


  const projectsTabHeading = useMemo(() => {
    // subtract 1 to account for the unassigned project
    const projectCount = filteredProjects.length - 1;
    return `${projectCount} Project${projectCount === 1 ? '' : 's'}`;
  }, [filteredProjects]);

  return (
    <div className={styles.projectsPanel}>
      <ListHeader
        heading="Projects"
        searchPlaceholder="Search by Project or Query Name"
        searchTerm={searchTerm}
        handleSearch={handleSearch}
      />
      <div className={styles.list}>
        {
          !user ? (
            <div className={styles.empty}>
              <p>
                <a href="/login" className={styles.link}>Log in</a> to view your saved projects.
              </p>
            </div>
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
                      {filteredProjects.map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          allProjects={projects}
                          searchTerm={searchTerm}
                          startRenaming={newProjectId === project.id}
                          onRename={handleRenameProject}
                        />
                      ))}
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