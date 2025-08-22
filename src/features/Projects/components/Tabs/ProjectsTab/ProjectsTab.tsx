import ProjectsTableHeader from '@/features/Projects/components/TableHeader/ProjectsTableHeader/ProjectsTableHeader';
import ProjectInnerErrorStates from '@/features/Projects/components/ProjectInnerErrorStates/ProjectInnerErrorStates';
import LoadingWrapper from '@/features/Common/components/LoadingWrapper/LoadingWrapper';
import ProjectCard from '@/features/Projects/components/ProjectCard/ProjectCard';
import { Project, UserQueryObject, ProjectListState } from '@/features/Projects/types/projects.d';
import { isUnassignedProject } from '@/features/Projects/utils/editUpdateFunctions';

interface ProjectsTabProps {
  sortedActiveProjects: Project[];
  projectListState: ProjectListState;
  projectsError: Error | null;
  projectsLoading: boolean;
  queries: UserQueryObject[];
  queriesLoading: boolean;
  projectsEmpty: boolean;
  onCreateNewProjectClick: () => void;
  onSetActiveTab: (tab: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  styles: Record<string, string>;
}

const ProjectsTab = ({
  sortedActiveProjects,
  projectListState,
  projectsError,
  projectsLoading,
  queries,
  queriesLoading,
  projectsEmpty,
  onCreateNewProjectClick,
  onSetActiveTab,
  onEditProject,
  onDeleteProject,
  styles
}: ProjectsTabProps) => {
  const { 
    selectedProjects, 
    setSelectedProjects, 
    searchTerm 
  } = projectListState;
  return (
    <>
      <ProjectsTableHeader 
        activeProjects={sortedActiveProjects}
        projectListState={projectListState}
      />
      {projectsError ? (
        <ProjectInnerErrorStates
          type="projects"
          styles={styles}
        />
      ) : (
        <LoadingWrapper
          loading={projectsLoading}
          wrapperClassName={styles.loadingWrapper}
          spinnerClassName={styles.loadingSpinner}
        >
          <div className={styles.projectGrid}>
            {projectsEmpty ? (
              <div className={styles.emptyState}>
                {searchTerm.length > 0 ? (
                  <p>No matches found.</p>
                ) : (
                  <>
                    <h6>No Projects</h6>
                    <p>
                      <span className={styles.link} onClick={onCreateNewProjectClick}>Create a New Project</span> to start organizing your queries.<br/>
                      You can also add queries to a new project from the <span className={styles.link} onClick={() => onSetActiveTab('Queries')}>Queries</span> tab.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                {sortedActiveProjects.map((project: Project, index: number) => {
                  const isLast = index === sortedActiveProjects.length - 1 && isUnassignedProject(project);
                  if (isLast) return null;

                  return (
                    <ProjectCard 
                      key={project.id}
                      queries={queries}
                      project={project}
                      searchTerm={searchTerm}
                      setSelectedProjects={setSelectedProjects}
                      selectedProjects={selectedProjects}
                      onEdit={onEditProject}
                      onDelete={onDeleteProject}
                      queriesLoading={queriesLoading}
                    />
                  );
                })}
              </>
            )}
            {sortedActiveProjects.length > 0 && isUnassignedProject(sortedActiveProjects[sortedActiveProjects.length - 1]) && (
              <>
                {/* Separator for the last project (Unassigned) */}
                <div className={styles.separator} />
                {/* Project Card for the last project (Unassigned) */}
                <ProjectCard 
                  key={`unassigned`}
                  queries={queries}
                  project={sortedActiveProjects[sortedActiveProjects.length - 1]}
                  searchTerm={searchTerm}
                  setSelectedProjects={setSelectedProjects}
                  selectedProjects={selectedProjects}
                  onEdit={onEditProject}
                  queriesLoading={queriesLoading}
                />
              </>
            )}
          </div>
        </LoadingWrapper>
      )}
    </>
  );
};

export default ProjectsTab;
