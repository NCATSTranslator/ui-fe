import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import styles from './ProjectDetailInner.module.scss';
import QueriesTableHeader from '@/features/Projects/components/TableHeader/QueriesTableHeader/QueriesTableHeader';
import QueryCard from '@/features/Projects/components/QueryCard/QueryCard';
import LoadingWrapper from '@/features/Common/components/LoadingWrapper/LoadingWrapper';
import { useUserProjects, useFormattedProjects, useUserQueries, useProjectDetailSortSearchSelectState } from '@/features/Projects/hooks/customHooks';
import { UserQueryObject, ProjectEditingItem, QueryEditingItem } from '@/features/Projects/types/projects.d';
import { filterAndSortQueries } from '@/features/Projects/utils/filterAndSortingFunctions';
import ProjectHeader from '@/features/Projects/components/ProjectHeader/ProjectHeader';
import Tabs from '@/features/Common/components/Tabs/Tabs';
import Tab from '@/features/Common/components/Tabs/Tab';
import { useEditProjectState, useEditProjectHandlers, useEditQueryState, useEditQueryHandlers, onSetIsEditingProject } from '@/features/Projects/utils/editUpdateFunctions';
import ProjectDetailErrorStates from '@/features/Projects/components/ProjectDetailErrorStates/ProjectDetailErrorStates';

const ProjectDetailInner = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const { data: projects = [], isLoading: projectLoading, error: projectError } = useUserProjects();
  const { data: queries = [], isLoading: queriesLoading, error: queriesError } = useUserQueries();
  const formattedProjects = useFormattedProjects(projects, queries);
  const project = useMemo(() => {
    return formattedProjects.find((p) => p.id === Number(projectId));
  }, [formattedProjects, projectId]);

  const projectQueries = useMemo(() => {
    if (!project) return [] as UserQueryObject[];
    return queries.filter((q: UserQueryObject) => project.data.pks.includes(q.data.qid));
  }, [project, queries]);

  // handles sorting, selection, and search state
  const {
    sortField,
    sortDirection,
    selectedQueries,
    searchTerm,
    setSearchTerm,
    setSelectedQueries,
    handleSort
  } = useProjectDetailSortSearchSelectState();

  const handleSetIsEditingQuery = (isEditing: boolean, editingItem?: QueryEditingItem) => {
    setQueryEditState(prev => ({ 
      ...prev, 
      isEditing, 
      ...(editingItem !== undefined && { editingItem })
    }));
  };

  const [projectEditState, setProjectEditState] = useEditProjectState();
  const [queryEditState, setQueryEditState] = useEditQueryState();

  const handleSetIsEditingProject = (isEditing: boolean, editingItem?: ProjectEditingItem) => {
    onSetIsEditingProject(
      isEditing,
      projectQueries,
      setProjectEditState,
      setSelectedQueries,
      editingItem
    );
  };

  const projectEditHandlers = useEditProjectHandlers(
    handleSetIsEditingProject, 
    project ? [project] : []
  );

  const queryEditHandlers = useEditQueryHandlers(
    handleSetIsEditingQuery, 
    projectQueries
  );
  
  const handleEditClick = () => {
    if (project) {
      projectEditHandlers.handleEditProject(project);
    }
  };

  const sortedQueries = useMemo(
    () => filterAndSortQueries(projectQueries, sortField, sortDirection, searchTerm),
    [projectQueries, sortField, sortDirection, searchTerm]
  );

  return (
    <div className={styles.projectDetail}>
      {
        projectError
        ? 
          (
            <ProjectDetailErrorStates
              type="projects"
              styles={styles}
            />
          ) 
        :
          (
            <>
              <div className={styles.projectHeaderContainer}>
                <LoadingWrapper loading={projectLoading} >
                  <ProjectHeader
                    backButtonText="All Projects"
                    bookmarkCount={project?.bookmark_count || 0}
                    isEditing={projectEditState.isEditing}
                    noteCount={project?.note_count || 0}
                    onCancelEdit={projectEditHandlers.handleCancelEdit}
                    onDeleteProject={projectEditHandlers.handleDeleteProject}
                    onDeleteQuery={queryEditHandlers.handleDeleteQuery}
                    onEditClick={handleEditClick}
                    onRestoreProject={projectEditHandlers.handleRestoreProject}
                    onRestoreQuery={queryEditHandlers.handleRestoreQuery}
                    onUpdateProjectItem={projectEditHandlers.handleUpdateProject}
                    project={project}
                    projectEditingItem={projectEditState.editingItem}
                    queriesLoading={queriesLoading}
                    searchPlaceholder="Search by Query Name"
                    searchTerm={searchTerm}
                    selectedQueries={selectedQueries}
                    setProjectEditingState={handleSetIsEditingProject}
                    setSearchTerm={setSearchTerm}
                    showBackButton={true}
                    subtitle={`${project?.data.pks.length} Quer${project?.data.pks.length === 1 ? 'y' : 'ies'}`}
                    title={project?.data.title || ''}
                  />
                </LoadingWrapper>
              </div>
              <Tabs 
                isOpen={true}
                handleTabSelection={() => {}}
                defaultActiveTab="Queries"
                className={styles.projectTabs}
              >
                {[
                  <Tab key="queries" heading="Queries" className={styles.projectTabContent}>
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
                    {
                      queriesError
                      ?
                        (
                          <ProjectDetailErrorStates
                            type="queries"
                            styles={styles}
                          />
                        )
                      : 
                        (
                          <LoadingWrapper loading={queriesLoading}>
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
                                    onEdit={queryEditHandlers.handleEditQuery}
                                  />
                                ))
                              )}
                            </div>
                          </LoadingWrapper>
                        )
                    }
                  </Tab>
                ]}
              </Tabs>
            </>
          )
      }
    </div>
  );
};

export default ProjectDetailInner;