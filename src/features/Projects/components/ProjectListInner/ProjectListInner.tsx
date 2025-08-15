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
import { ProjectRaw, UserQueryObject, SortField, SortDirection, Project, QueryEditingItem, ProjectEditingItem } from '@/features/Projects/types/projects.d';
import { filterAndSortProjects, filterAndSortQueries } from '@/features/Projects/utils/filterAndSortingFunctions';
import { useFormattedProjects } from '@/features/Projects/hooks/customHooks';
import LoadingWrapper from '@/features/Common/components/LoadingWrapper/LoadingWrapper';
import { useEditProjectState, useEditProjectHandlers, useEditQueryState, useEditQueryHandlers, onSetIsEditingProject, isUnassignedProject } from '@/features/Projects/utils/editUpdateFunctions';
import Button from '@/features/Core/components/Button/Button';
import FolderIcon from '@/assets/icons/projects/folder.svg?react';
import TrashIcon from '@/assets/icons/buttons/TrashFilled.svg?react';
import DeletedTableHeader from '@/features/Projects/components/TableHeader/DeletedTableHeader/DeletedTableHeader';
import ProjectInnerErrorStates from '@/features/Projects/components/ProjectInnerErrorStates/ProjectInnerErrorStates';
import EditQueryModal from '@/features/Projects/components/EditQueryModal/EditQueryModal';

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

  const handleSetIsEditingProject = (isEditing: boolean, editingItem?: ProjectEditingItem) => {
    onSetIsEditingProject(
      isEditing,
      activeQueries,
      setProjectEditState,
      setSelectedQueries,
      editingItem
    );
  };

  const handleSetIsEditingQuery = (isEditing: boolean, editingItem?: QueryEditingItem) => {
    setQueryEditState({isEditing: isEditing, editingItem: editingItem || undefined});
    if(isEditing && editingItem?.type === 'query')
      setIsEditQueryModalOpen(true);
    else 
      setIsEditQueryModalOpen(false);
  };

  const [projectEditState, setProjectEditState] = useEditProjectState();
  const [queryEditState, setQueryEditState] = useEditQueryState();

  const projectEditHandlers = useEditProjectHandlers(handleSetIsEditingProject, activeFormattedProjects);
  const queryEditHandlers = useEditQueryHandlers(handleSetIsEditingQuery, activeQueries);

  const [isEditQueryModalOpen, setIsEditQueryModalOpen] = useState(false);

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
    selectedProjects.forEach((project: Project) => projectEditHandlers.handleDeleteProject(project));
    selectedQueries.forEach((query: UserQueryObject) => queryEditHandlers.handleDeleteQuery(query));
    setSelectedProjects([]);
    setSelectedQueries([]);
  };

  const [searchTerm, setSearchTerm] = useState<string>('');

  const sortedActiveProjects = useMemo(() => filterAndSortProjects(activeFormattedProjects, activeQueries, sortField, sortDirection, searchTerm), [activeFormattedProjects, activeQueries, sortField, sortDirection, searchTerm]);
  const sortedActiveQueries = useMemo(() => filterAndSortQueries(activeQueries, sortField, sortDirection, searchTerm), [activeQueries, sortField, sortDirection, searchTerm]);

  const sortedDeletedProjects = useMemo(() => filterAndSortProjects(deletedFormattedProjects.filter(project => !isUnassignedProject(project)), deletedQueries, sortField, sortDirection, searchTerm), [deletedFormattedProjects, deletedQueries, sortField, sortDirection, searchTerm]);
  const sortedDeletedQueries = useMemo(() => filterAndSortQueries(deletedQueries, sortField, sortDirection, searchTerm), [deletedQueries, sortField, sortDirection, searchTerm]);

  const hideProjectsTab = (searchTerm.length > 0 && sortedActiveProjects.length === 0) || (projectEditState.isEditing);
  const hideQueriesTab = (searchTerm.length > 0 && sortedActiveQueries.length === 0);
  const hideTrashTab = (searchTerm.length > 0 && sortedDeletedProjects.length === 0 && sortedDeletedQueries.length === 0) || (projectEditState.isEditing);

  // reset active tab back to projects when editing is finished
  useEffect(() => {
    if (!projectEditState.isEditing) {
      setActiveTab('Projects');
    }
  }, [projectEditState.isEditing]);

  return (
    <div className={`${styles.projectListContainer} ${projectEditState.isEditing ? styles.isEditing : ''}`}>
      <EditQueryModal
        currentEditingQueryItem={queryEditState.editingItem?.type === 'query' ? queryEditState.editingItem : undefined}
        handleClose={() => setIsEditQueryModalOpen(false)}
        isOpen={isEditQueryModalOpen}
        loading={queriesLoading}
        mode="edit"
        projects={activeFormattedProjects}
        // selectedProjects={selectedProjects}
        // setSelectedProjects={setSelectedProjects}
      />
      <div className="container">
        <div className={styles.projectList}>
          <ProjectHeader
            title="Projects"
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchPlaceholder="Search by Project or Query Name"
            showCreateButton={true}
            variant="list"
            isEditing={projectEditState.isEditing}
            setProjectEditingState={handleSetIsEditingProject}
            projectEditingItem={projectEditState.editingItem}
            onUpdateProjectItem={projectEditHandlers.handleUpdateProject}
            onCancelEdit={projectEditHandlers.handleCancelEdit}
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
                                            onEdit={projectEditHandlers.handleEditProject}
                                            queriesLoading={queriesLoading}
                                          />
                                          {/* Add separator before the last project (Unassigned), if the 
                                          unassigned project is included in the sortedActiveProjects array */}
                                          {
                                            index === sortedActiveProjects.length - 2 && 
                                            !isUnassignedProject(project) && 
                                            sortedActiveProjects.some(p => isUnassignedProject(p)) && (
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
                                        onEdit={queryEditHandlers.handleEditQuery}
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
                                        queriesLoading={queriesLoading}
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
                      {(selectedQueries.length > 0 && !projectEditState.isEditing) && (
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