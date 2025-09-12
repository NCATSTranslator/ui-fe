import DeletedTableHeader from '@/features/Projects/components/TableHeader/DeletedTableHeader/DeletedTableHeader';
import LoadingWrapper from '@/features/Common/components/LoadingWrapper/LoadingWrapper';
import ProjectCard from '@/features/Projects/components/ProjectCard/ProjectCard';
import QueryCard from '@/features/Projects/components/QueryCard/QueryCard';
import { Project, ProjectRaw, UserQueryObject, ProjectListState, DataCardLocation } from '@/features/Projects/types/projects.d';

interface TrashTabProps {
  location: DataCardLocation;
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
  location,
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
    // sortField, 
    // sortDirection, 
    // handleSort, 
    searchTerm 
  } = projectListState;

  const noDeletedProjects = sortedDeletedProjects.length === 0;
  const noDeletedQueries = sortedDeletedQueries.length === 0;
  const noDeletedItems = noDeletedProjects && noDeletedQueries;
  return (
    <>
      {
        !noDeletedItems && (
        <DeletedTableHeader
          activeProjects={sortedDeletedProjects}
            activeQueries={sortedDeletedQueries}
            projectListState={projectListState}
          />
        )
      }
      {noDeletedItems ? (
        <div className={styles.emptyState}>
          <h6>Trash is Empty</h6>
          <p>Whenever you delete a query it will be moved here.</p>
        </div>
      ) : (
        <>
          {!noDeletedProjects && (
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
          {!noDeletedQueries && (
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
                      location={location}
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
