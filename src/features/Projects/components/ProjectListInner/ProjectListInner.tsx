import { useMemo, useState } from 'react';
import styles from '@/features/Projects/components/ProjectListInner/ProjectListInner.module.scss';
import ProjectListHeader from '@/features/Projects/components/ProjectListHeader/ProjectListHeader';
import Tabs from '@/features/Common/components/Tabs/Tabs';
import Tab from '@/features/Common/components/Tabs/Tab';
import ProjectCard from '@/features/Projects/components/ProjectCard/ProjectCard';
import QueryCard from '@/features/Projects/components/QueryCard/QueryCard';
import ProjectsTableHeader from '@/features/Projects/components/TableHeader/ProjectsTableHeader/ProjectsTableHeader';
import QueriesTableHeader from '@/features/Projects/components/TableHeader/QueriesTableHeader/QueriesTableHeader';
import { useUserProjects, useUserQueryStatus } from '@/features/Projects/hooks/customHooks';
import { ProjectRaw, QueryStatusObject, SortField, SortDirection, Project } from '@/features/Projects/types/projects.d';
import { sortProjects, sortQueries } from '@/features/Projects/utils/sortingFunctions';
import { useFormattedProjects } from '@/features/Projects/hooks/customHooks';
import LoadingWrapper from '@/features/Common/components/LoadingWrapper/LoadingWrapper';

export const ProjectListInner = () => {
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useUserProjects();
  const { data: queries = [], isLoading: queriesLoading, error: queriesError } = useUserQueryStatus();
  const [activeTab, setActiveTab] = useState<string>('Projects');
  
  const [sortField, setSortField] = useState<SortField>('lastSeen');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const activeProjects = projects.filter((project: ProjectRaw) => !project.deleted);
  const deletedProjects = projects.filter((project: ProjectRaw) => project.deleted);
  const activeQueries = queries.filter((query: QueryStatusObject) => !query.data.deleted);
  const deletedQueries = queries.filter((query: QueryStatusObject) => query.data.deleted);

  // Format projects with calculated fields (bookmarks, notes, etc.)
  const activeFormattedProjects = useFormattedProjects(activeProjects, queries);
  const deletedFormattedProjects = useFormattedProjects(deletedProjects, queries);

  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const [selectedQueries, setSelectedQueries] = useState<QueryStatusObject[]>([]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleTabSelection = (tabName: string) => {
    setActiveTab(tabName);
  };

  const isLoading = projectsLoading || queriesLoading;
  const hasError = projectsError || queriesError;

  const sortedActiveProjects = useMemo(() => sortProjects(activeFormattedProjects, sortField, sortDirection), [activeFormattedProjects, sortField, sortDirection]);
  const sortedActiveQueries = useMemo(() => sortQueries(activeQueries, sortField, sortDirection), [activeQueries, sortField, sortDirection]);

  if (isLoading) {
    return (
      <div className={styles.projectList}>
        <ProjectListHeader />
        <LoadingWrapper loading={isLoading} />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={styles.projectList}>
        <ProjectListHeader />
        <LoadingWrapper loading={isLoading}>
          <div className={styles.error}>Error loading data. Please try again.</div>
        </LoadingWrapper>
      </div>
    );
  }

  return (
    <div className={styles.projectList}>
      <ProjectListHeader />
      <Tabs 
        isOpen={true}
        handleTabSelection={handleTabSelection}
        defaultActiveTab="Projects"
        className={styles.projectTabs}
      >
        <Tab heading="Projects" className={styles.projectTabContent}>
          {activeProjects.length > 0 && (
            <ProjectsTableHeader 
              selectedProjects={selectedProjects}
              setSelectedProjects={setSelectedProjects}
              activeProjects={activeFormattedProjects}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          )}
          <div className={styles.projectGrid}>
            {activeProjects.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No projects found. Create your first project to get started.</p>
              </div>
            ) : (
              sortedActiveProjects.map((project: Project) => (
                <ProjectCard 
                  key={project.id}
                  queries={queries}
                  project={project}
                  setSelectedProjects={setSelectedProjects}
                  selectedProjects={selectedProjects}
                />
              ))
            )}
          </div>
        </Tab>
        <Tab heading="Queries" className={styles.projectTabContent}>
          {
            activeQueries.length > 0 && (
              <QueriesTableHeader 
                selectedQueries={selectedQueries}
                setSelectedQueries={setSelectedQueries}
                activeQueries={activeQueries}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            )
          }
          <div className={styles.projectGrid}>
            {activeQueries.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No queries found. Your saved queries will appear here.</p>
              </div>
            ) : (
              sortedActiveQueries.map((query: QueryStatusObject) => (
                <QueryCard 
                  key={query.data.qid}
                  query={query}
                  setSelectedQueries={setSelectedQueries}
                  selectedQueries={selectedQueries}
                />
              ))
            )}
          </div>
        </Tab>
        <Tab heading="Trash" className={styles.projectTabContent}>
          <div className={styles.projectGrid}>
            {deletedProjects.length === 0 && deletedQueries.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No deleted items found.</p>
              </div>
            ) : (
              <>
                {deletedProjects.length > 0 && (
                  <div className={styles.deletedSection}>
                    <h4>Deleted Projects</h4>
                    {deletedFormattedProjects.map((project: Project) => (
                      <ProjectCard 
                        key={project.id}
                        queries={queries}
                        project={project}
                        setSelectedProjects={setSelectedProjects}
                        selectedProjects={selectedProjects}
                      />
                    ))}
                  </div>
                )}
                {deletedQueries.length > 0 && (
                  <div className={styles.deletedSection}>
                    <h4>Deleted Queries</h4>
                    {deletedQueries.map((query: QueryStatusObject) => (
                      <QueryCard 
                        key={query.data.qid}
                        query={query}
                        setSelectedQueries={setSelectedQueries}
                        selectedQueries={selectedQueries}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};