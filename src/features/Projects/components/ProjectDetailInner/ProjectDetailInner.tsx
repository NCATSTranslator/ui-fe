import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from './ProjectDetailInner.module.scss';
import QueriesTableHeader from '@/features/Projects/components/TableHeader/QueriesTableHeader/QueriesTableHeader';
import QueryCard from '@/features/Projects/components/QueryCard/QueryCard';
import LoadingWrapper from '@/features/Common/components/LoadingWrapper/LoadingWrapper';
import { useUserProjects, useUserQueryStatus } from '@/features/Projects/hooks/customHooks';
import { QueryStatusObject, SortField, SortDirection } from '@/features/Projects/types/projects.d';
import { filterAndSortQueries } from '@/features/Projects/utils/filterAndSortingFunctions';
import ProjectHeader from '@/features/Projects/components/ProjectHeader/ProjectHeader';

const ProjectDetailInner = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useUserProjects();
  const { data: queries = [], isLoading: queriesLoading, error: queriesError } = useUserQueryStatus();

  const project = useMemo(() => projects.find((p) => p.id === Number(projectId)), [projects, projectId]);

  const projectQueries = useMemo(() => {
    if (!project) return [] as QueryStatusObject[];
    return queries.filter((q: QueryStatusObject) => project.qids.includes(q.data.qid));
  }, [project, queries]);

  // Sorting & searching state
  const [sortField, setSortField] = useState<SortField>('lastSeen');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedQueries, setSelectedQueries] = useState<QueryStatusObject[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedQueries = useMemo(
    () => filterAndSortQueries(projectQueries, sortField, sortDirection, searchTerm),
    [projectQueries, sortField, sortDirection, searchTerm]
  );

  const isLoading = projectsLoading || queriesLoading;
  const hasError = projectsError || queriesError;

  if (isLoading) {
    return <LoadingWrapper loading={true} />;
  }

  if (hasError || !project) {
    return <div className={styles.error}>Unable to load project.</div>;
  }

  return (
    <div className={styles.projectDetail}>
      <ProjectHeader
        title={project.title}
        subtitle={`${projectQueries.length} Quer${projectQueries.length === 1 ? 'y' : 'ies'}`}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchPlaceholder="Search by Query Name"
        showBackButton={true}
        backButtonText="All Projects"
      />

      {sortedQueries.length > 0 && (
        <QueriesTableHeader
          activeQueries={sortedQueries}
          selectedQueries={selectedQueries}
          setSelectedQueries={setSelectedQueries}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      )}

      <div className={styles.queryGrid}>
        {sortedQueries.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No queries found{searchTerm ? ' matching your search.' : '.'}</p>
          </div>
        ) : (
          sortedQueries.map((query) => (
            <QueryCard
              key={query.data.qid}
              query={query}
              searchTerm={searchTerm}
              setSelectedQueries={setSelectedQueries}
              selectedQueries={selectedQueries}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectDetailInner;