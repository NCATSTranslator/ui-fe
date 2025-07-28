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
import { filterAndSortProjects, filterAndSortQueries } from '@/features/Projects/utils/filterAndSortingFunctions';
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
  const [searchTerm, setSearchTerm] = useState<string>('');

  const sortedActiveProjects = useMemo(() => filterAndSortProjects(activeFormattedProjects, sortField, sortDirection, searchTerm), [activeFormattedProjects, sortField, sortDirection, searchTerm]);
  const sortedActiveQueries = useMemo(() => filterAndSortQueries(activeQueries, sortField, sortDirection, searchTerm), [activeQueries, sortField, sortDirection, searchTerm]);

  const sortedDeletedProjects = useMemo(() => filterAndSortProjects(deletedFormattedProjects, sortField, sortDirection, searchTerm), [deletedFormattedProjects, sortField, sortDirection, searchTerm]);
  const sortedDeletedQueries = useMemo(() => filterAndSortQueries(deletedQueries, sortField, sortDirection, searchTerm), [deletedQueries, sortField, sortDirection, searchTerm]);

  const hideProjectsTab = searchTerm.length > 0 && sortedActiveProjects.length === 0;
  const hideQueriesTab = searchTerm.length > 0 && sortedActiveQueries.length === 0;
  const hideTrashTab = searchTerm.length > 0 && sortedDeletedProjects.length === 0 && sortedDeletedQueries.length === 0;

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
      <ProjectListHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      {
        hideProjectsTab && hideQueriesTab && hideTrashTab
        ?
          <div className={styles.emptyState}>
            <p>No Matches Found</p>
          </div>
        :  <Tabs 
            isOpen={true}
            handleTabSelection={handleTabSelection}
            defaultActiveTab="Projects"
            className={styles.projectTabs}
          >
            {
              !hideProjectsTab
              ?
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
                    {sortedActiveProjects.length === 0 ? (
                      <div className={styles.emptyState}>
                        {
                          searchTerm.length > 0 
                          ? 
                            (
                              <p>No projects found matching your search.</p>
                            )
                          :
                            (
                              <p>No projects found. Create your first project to get started.</p>
                            )
                        }
                      </div>
                    ) : (
                      sortedActiveProjects.map((project: Project) => (
                        <ProjectCard 
                          key={project.id}
                          queries={queries}
                          project={project}
                          searchTerm={searchTerm}
                          setSelectedProjects={setSelectedProjects}
                          selectedProjects={selectedProjects}
                        />
                      ))
                    )}
                  </div>
                </Tab>
              : null
            }
            {
              !hideQueriesTab
              ?
                <Tab heading="Queries" className={styles.projectTabContent}>
                  {
                    activeQueries.length > 0 && (
                      <QueriesTableHeader 
                        activeQueries={activeQueries}
                        onSort={handleSort}
                        selectedQueries={selectedQueries}
                        setSelectedQueries={setSelectedQueries}
                        sortField={sortField}
                        sortDirection={sortDirection}
                      />
                    )
                  }
                  <div className={styles.projectGrid}>
                    {sortedActiveQueries.length === 0 ? (
                      <div className={styles.emptyState}>
                        {
                          searchTerm.length > 0 
                          ? 
                            (
                              <p>No queries found matching your search.</p>
                            )
                          :
                            (
                              <p>No queries found. Your saved queries will appear here.</p>
                            )
                        }
                      </div>
                    ) : (
                      sortedActiveQueries.map((query: QueryStatusObject) => (
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
                </Tab>
              : null
            }
            {
              !hideTrashTab
              ?
                <Tab heading="Trash" className={styles.projectTabContent}>
                  <div className={styles.projectGrid}>
                    {sortedDeletedProjects.length === 0 && sortedDeletedQueries.length === 0 ? (
                      <div className={styles.emptyState}>
                        <p>No deleted items found.</p>
                      </div>
                    ) : (
                      <>
                        {sortedDeletedProjects.length > 0 && (
                          <div className={styles.deletedSection}>
                            <h4>Deleted Projects</h4>
                            {deletedFormattedProjects.map((project: Project) => (
                              <ProjectCard 
                                key={project.id}
                                queries={queries}
                                project={project}
                                searchTerm={searchTerm}
                                setSelectedProjects={setSelectedProjects}
                                selectedProjects={selectedProjects}
                              />
                            ))}
                          </div>
                        )}
                        {sortedDeletedQueries.length > 0 && (
                          <div className={styles.deletedSection}>
                            <h4>Deleted Queries</h4>
                            {deletedQueries.map((query: QueryStatusObject) => (
                              <QueryCard 
                                key={query.data.qid}
                                query={query}
                                searchTerm={searchTerm}
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
              : null
            }
          </Tabs>
      }
    </div>
  );
};