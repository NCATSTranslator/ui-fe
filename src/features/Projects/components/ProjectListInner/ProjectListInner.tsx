import { useEffect, useMemo, useState } from 'react';
import styles from '@/features/Projects/components/ProjectListInner/ProjectListInner.module.scss';
import ProjectHeader from '@/features/Projects/components/ProjectHeader/ProjectHeader';
import Tabs from '@/features/Common/components/Tabs/Tabs';
import Tab from '@/features/Common/components/Tabs/Tab';
import ProjectCard from '@/features/Projects/components/ProjectCard/ProjectCard';
import QueryCard from '@/features/Projects/components/QueryCard/QueryCard';
import ProjectsTableHeader from '@/features/Projects/components/TableHeader/ProjectsTableHeader/ProjectsTableHeader';
import QueriesTableHeader from '@/features/Projects/components/TableHeader/QueriesTableHeader/QueriesTableHeader';
import { useUserProjects, useUserQueries } from '@/features/Projects/hooks/customHooks';
import { ProjectRaw, UserQueryObject, SortField, SortDirection, Project, EditingItem } from '@/features/Projects/types/projects.d';
import { filterAndSortProjects, filterAndSortQueries } from '@/features/Projects/utils/filterAndSortingFunctions';
import { useFormattedProjects } from '@/features/Projects/hooks/customHooks';
import LoadingWrapper from '@/features/Common/components/LoadingWrapper/LoadingWrapper';
import { useEditProjectQueryState, useEditProjectQueryHandlers } from '@/features/Projects/utils/editUpdateFunctions';
import Button from '@/features/Core/components/Button/Button';
import FolderIcon from '@/assets/icons/projects/folder.svg?react';
import TrashIcon from '@/assets/icons/buttons/TrashFilled.svg?react';
import DeletedTableHeader from '../TableHeader/DeletedTableHeader/DeletedTableHeader';
import ProjectInnerErrorStates from '../ProjectInnerErrorStates/ProjectInnerErrorStates';

export const ProjectListInner = () => {
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useUserProjects();
  const { data: queries = [], isLoading: queriesLoading, error: queriesError } = useUserQueries();
  const [activeTab, setActiveTab] = useState<string>('Projects');
  
  const [sortField, setSortField] = useState<SortField>('lastSeen');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const activeProjects = projects.filter((project: ProjectRaw) => !project.deleted);
  const deletedProjects = projects.filter((project: ProjectRaw) => project.deleted);
  const activeQueries = queries.filter((query: UserQueryObject) => !query.data.deleted);
  const deletedQueries = queries.filter((query: UserQueryObject) => query.data.deleted);

  // Format projects with calculated fields (bookmarks, notes, etc.)
  const activeFormattedProjects = useFormattedProjects(activeProjects, queries);
  const deletedFormattedProjects = useFormattedProjects(deletedProjects, queries, false);

  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const [selectedQueries, setSelectedQueries] = useState<UserQueryObject[]>([]);

  const handleSetIsEditing = (isEditing: boolean, editingItem?: EditingItem) => {
    setEditState(prev => ({ 
      ...prev, 
      isEditing, 
      ...(editingItem !== undefined && { editingItem })
    }));
    if(isEditing) {
      const selectedQids = editingItem?.queryIds || [];
      const selectedQueries = activeQueries.filter(query => selectedQids.includes(query.data.qid));
      setSelectedQueries(selectedQueries);
    } else {
      setSelectedQueries([]);
    }
  };

  const [editState, setEditState] = useEditProjectQueryState();
  const editHandlers = useEditProjectQueryHandlers(
    handleSetIsEditing, 
    activeFormattedProjects, 
    activeQueries
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleTabSelection = (tabName: string) => {
    if(activeTab != tabName) {
      setActiveTab(tabName);
      // TODO: reset selected items when tab is changed. The below doesn't work bc the active tab is changed when a project is edited.
      // setSelectedProjects([]);
      // setSelectedQueries([]);
    }
  };

  const handleDelete = () => {
    selectedProjects.forEach((project: Project) => editHandlers.handleDeleteProject(project));
    selectedQueries.forEach((query: UserQueryObject) => editHandlers.handleDeleteQuery(query));
    setSelectedProjects([]);
    setSelectedQueries([]);
  };

  const isLoading = projectsLoading || queriesLoading;
  const hasError = projectsError || queriesError;
  const [searchTerm, setSearchTerm] = useState<string>('');

  const sortedActiveProjects = useMemo(() => filterAndSortProjects(activeFormattedProjects, activeQueries, sortField, sortDirection, searchTerm), [activeFormattedProjects, activeQueries, sortField, sortDirection, searchTerm]);
  const sortedActiveQueries = useMemo(() => filterAndSortQueries(activeQueries, sortField, sortDirection, searchTerm), [activeQueries, sortField, sortDirection, searchTerm]);

  const sortedDeletedProjects = useMemo(() => filterAndSortProjects(deletedFormattedProjects.filter(project => project.id !== -1), deletedQueries, sortField, sortDirection, searchTerm), [deletedFormattedProjects, deletedQueries, sortField, sortDirection, searchTerm]);
  const sortedDeletedQueries = useMemo(() => filterAndSortQueries(deletedQueries, sortField, sortDirection, searchTerm), [deletedQueries, sortField, sortDirection, searchTerm]);

  const hideProjectsTab = (searchTerm.length > 0 && sortedActiveProjects.length === 0) || (editState.editingItem?.type !== "query" && editState.isEditing);
  const hideQueriesTab = (searchTerm.length > 0 && sortedActiveQueries.length === 0);
  const hideTrashTab = (searchTerm.length > 0 && sortedDeletedProjects.length === 0 && sortedDeletedQueries.length === 0) || (editState.editingItem?.type !== "query" && editState.isEditing);

  // reset active tab back to projects when editing is finished
  useEffect(() => {
    if (!editState.isEditing) {
      setActiveTab('Projects');
    }
  }, [editState.isEditing]);

  // if (hasError) {
  //   return (
  //     <div className={styles.projectList}>
  //       <ProjectHeader
  //         title="Projects"
  //         searchTerm={searchTerm}
  //         setSearchTerm={setSearchTerm}
  //         searchPlaceholder="Search by Project or Query Name"
  //         showCreateButton={true}
  //         variant="list"
  //         isEditing={editState.isEditing}
  //         setIsEditing={handleSetIsEditing}
  //         editingItem={editState.editingItem}
  //         onUpdateItem={editHandlers.handleUpdateItem}
  //         onCancelEdit={editHandlers.handleCancelEdit}
  //       />
  //       <LoadingWrapper loading={isLoading}>
  //         <div className={styles.error}>Error loading data. Please try again.</div>
  //       </LoadingWrapper>
  //     </div>
  //   );
  // }

  return (
    <div className={`${styles.projectListContainer} ${editState.isEditing ? styles.isEditing : ''}`}>
      <div className="container">
        <div className={styles.projectList}>
          <ProjectHeader
            title="Projects"
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchPlaceholder="Search by Project or Query Name"
            showCreateButton={true}
            variant="list"
            isEditing={editState.isEditing}
            setIsEditing={handleSetIsEditing}
            editingItem={editState.editingItem}
            onUpdateItem={editHandlers.handleUpdateItem}
            onCancelEdit={editHandlers.handleCancelEdit}
            selectedQueries={selectedQueries}
          />
          {
            hideProjectsTab && hideQueriesTab && hideTrashTab
            ?
              <div className={styles.emptyState}>
                <p>No Matches Found</p>
              </div>
            : 
              <div className={styles.projectListInner}>
                <Tabs 
                  isOpen={true}
                  handleTabSelection={handleTabSelection}
                  defaultActiveTab="Projects"
                  className={styles.projectTabs}
                  tabListClassName={styles.projectTabsList}
                  activeTab={activeTab}
                  controlled={true}
                >
                  {
                    !hideProjectsTab
                    ?
                      <Tab heading="Projects" className={styles.projectTabContent}>
                        <ProjectsTableHeader 
                          activeProjects={sortedActiveProjects}
                          selectedProjects={selectedProjects}
                          setSelectedProjects={setSelectedProjects}
                          sortField={sortField}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        />
                        {
                          projectsError
                          ? 
                            (
                              <ProjectInnerErrorStates
                                type="projects"
                                styles={styles}
                              />
                            )
                          :
                            (                              
                              <LoadingWrapper
                                loading={projectsLoading}
                                wrapperClassName={styles.loadingWrapper}
                                spinnerClassName={styles.loadingSpinner}
                              >
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
                                    <>
                                      {sortedActiveProjects.map((project: Project, index: number) => (
                                        <>
                                          <ProjectCard 
                                            key={project.id}
                                            queries={queries}
                                            project={project}
                                            searchTerm={searchTerm}
                                            setSelectedProjects={setSelectedProjects}
                                            selectedProjects={selectedProjects}
                                            onEdit={editHandlers.handleEditProject}
                                          />
                                          {/* Add separator before the last project (Unassigned) */}
                                          {index === sortedActiveProjects.length - 2 && project.id !== -1 && (
                                            <div className={styles.separator} />
                                          )}
                                        </>
                                      ))}
                                    </>
                                  )}
                                </div>
                              </LoadingWrapper>
                            )
                        }
                      </Tab>
                    : null
                  }
                  {
                    !hideQueriesTab
                    ?
                      <Tab heading="Queries" className={styles.projectTabContent}>
                        <QueriesTableHeader 
                          activeQueries={sortedActiveQueries}
                          onSort={handleSort}
                          selectedQueries={selectedQueries}
                          setSelectedQueries={setSelectedQueries}
                          sortField={sortField}
                          sortDirection={sortDirection}
                        />
                        {
                          queriesError
                          ?
                            (
                              <ProjectInnerErrorStates
                                type="queries"
                                styles={styles}
                              />
                            )
                          :
                            (                              
                              <LoadingWrapper
                                loading={queriesLoading}
                                wrapperClassName={styles.loadingWrapper}
                                spinnerClassName={styles.loadingSpinner}
                              >
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
                                    sortedActiveQueries.map((query: UserQueryObject) => (
                                      <QueryCard 
                                        key={query.data.qid}
                                        query={query}
                                        searchTerm={searchTerm}
                                        setSelectedQueries={setSelectedQueries}
                                        selectedQueries={selectedQueries}
                                        onEdit={editHandlers.handleEditQuery}
                                      />
                                    ))
                                  )}
                                </div>
                              </LoadingWrapper>
                            )
                        }
                      </Tab>
                    : null
                  }
                  {
                    !hideTrashTab
                    ?
                      <Tab heading="Trash" className={styles.projectTabContent}>
                        <DeletedTableHeader
                          activeProjects={sortedDeletedProjects}
                          activeQueries={sortedDeletedQueries}
                          onSort={handleSort}
                          selectedProjects={selectedProjects}
                          setSelectedProjects={setSelectedProjects}
                          selectedQueries={selectedQueries}
                          setSelectedQueries={setSelectedQueries}
                          sortDirection={sortDirection}
                          sortField={sortField}
                        />
                        {sortedDeletedProjects.length === 0 && sortedDeletedQueries.length === 0 ? (
                          <div className={styles.emptyState}>
                            <p>No deleted items found.</p>
                          </div>
                        ) : (
                          <>
                            <div className={styles.deletedWrapper}>
                              <LoadingWrapper
                                loading={projectsLoading}
                                wrapperClassName={styles.loadingWrapper}
                                spinnerClassName={styles.loadingSpinner}
                              >
                                <div className={styles.projectGrid}>
                                  {sortedDeletedProjects.length > 0 && (
                                    sortedDeletedProjects.map((project: Project) => (
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
                              </LoadingWrapper>
                            </div>
                            <div className={styles.deletedWrapper}>
                              <LoadingWrapper
                                loading={queriesLoading}
                                wrapperClassName={styles.loadingWrapper}
                                spinnerClassName={styles.loadingSpinner}
                              >
                                <div className={styles.projectGrid}>
                                  {sortedDeletedQueries.length > 0 && (
                                    sortedDeletedQueries.map((query: UserQueryObject) => (
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
                              </LoadingWrapper>
                            </div>
                          </>
                        )}
                      </Tab>
                    : null
                  }
                </Tabs>
                <div className={styles.selectedInteractions}>
                  {(selectedProjects.length > 0 || selectedQueries.length > 0) && (
                    <>
                      <span>{selectedProjects.length || selectedQueries.length} Selected</span>
                      {(selectedQueries.length > 0 && !editState.isEditing) && (
                        <Button
                          variant="secondary"
                          handleClick={() => {}}
                          iconLeft={<FolderIcon />}
                          small
                          className={styles.button}
                        >
                          Add to Project
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        handleClick={handleDelete}
                        iconLeft={<TrashIcon />}
                        small
                        className={styles.button}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
          }
        </div>
      </div>
    </div>
  );
};