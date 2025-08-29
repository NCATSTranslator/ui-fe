import DeletedTableHeader from '@/features/Projects/components/TableHeader/DeletedTableHeader/DeletedTableHeader';
import LoadingWrapper from '@/features/Common/components/LoadingWrapper/LoadingWrapper';
import ProjectCard from '@/features/Projects/components/ProjectCard/ProjectCard';
import QueryCard from '@/features/Projects/components/QueryCard/QueryCard';
import { Project, ProjectRaw, UserQueryObject, ProjectListState } from '@/features/Projects/types/projects.d';

interface TrashTabProps {
  sortedDeletedProjects: Project[];
  sortedDeletedQueries: UserQueryObject[];
  projectListState: ProjectListState;
  projectsLoading: boolean;
  queriesLoading: boolean;
  queries: UserQueryObject[];
  rawProjects: ProjectRaw[];
  onDeleteProject: (project: Project) => void;
  onDeleteQuery: (query: UserQueryObject) => void;
  styles: Record<string, string>;
}

const TrashTab = ({
  sortedDeletedProjects,
  sortedDeletedQueries,
  rawProjects,
  projectListState,
  projectsLoading,
  queriesLoading,
  queries,
  onDeleteProject,
  onDeleteQuery,
  styles
}: TrashTabProps) => {
  const { 
    selectedProjects, 
    selectedQueries, 
    setSelectedProjects, 
    setSelectedQueries, 
    sortField, 
    sortDirection, 
    handleSort, 
    searchTerm 
  } = projectListState;
  return (
    <>
      <DeletedTableHeader
        activeProjects={sortedDeletedProjects}
        activeQueries={sortedDeletedQueries}
        projectListState={projectListState}
      />
      {sortedDeletedProjects.length === 0 && sortedDeletedQueries.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No deleted items found.</p>
        </div>
      ) : (
        <>
          {sortedDeletedProjects.length > 0 && (
            <div className={styles.deletedWrapper}>
              <LoadingWrapper
                loading={projectsLoading}
                wrapperClassName={styles.loadingWrapper}
                spinnerClassName={styles.loadingSpinner}
              >
                <div className={styles.projectGrid}>
                  {sortedDeletedProjects.map((project: Project) => (
                    <ProjectCard 
                      key={project.id}
                      queries={queries}
                      project={project}
                      projects={rawProjects}
                      searchTerm={searchTerm}
                      setSelectedProjects={setSelectedProjects}
                      selectedProjects={selectedProjects}
                      queriesLoading={queriesLoading}
                      onDelete={onDeleteProject}
                    />
                  ))}
                </div>
              </LoadingWrapper>
            </div>
          )}
          {sortedDeletedQueries.length > 0 && (
            <div className={styles.deletedWrapper}>
              <LoadingWrapper
                loading={queriesLoading}
                wrapperClassName={styles.loadingWrapper}
                spinnerClassName={styles.loadingSpinner}
              >
                <div className={styles.projectGrid}>
                  {sortedDeletedQueries.map((query: UserQueryObject) => (
                    <QueryCard 
                      key={query.data.qid}
                      query={query}
                      queries={queries}
                      searchTerm={searchTerm}
                      setSelectedQueries={setSelectedQueries}
                      selectedQueries={selectedQueries}
                      onDelete={onDeleteQuery}
                    />
                  ))}
                </div>
              </LoadingWrapper>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default TrashTab;
