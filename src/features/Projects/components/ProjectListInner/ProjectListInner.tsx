import { useEffect, useMemo, useState } from 'react';
import styles from '@/features/Projects/components/ProjectListInner/ProjectListInner.module.scss';
import ProjectHeader from '@/features/Projects/components/ProjectHeader/ProjectHeader';
import Tabs from '@/features/Common/components/Tabs/Tabs';
import Tab from '@/features/Common/components/Tabs/Tab';
import ProjectCard from '@/features/Projects/components/ProjectCard/ProjectCard';
import QueryCard from '@/features/Projects/components/QueryCard/QueryCard';
import ProjectsTableHeader from '@/features/Projects/components/TableHeader/ProjectsTableHeader/ProjectsTableHeader';
import QueriesTableHeader from '@/features/Projects/components/TableHeader/QueriesTableHeader/QueriesTableHeader';
import { useShouldShowDeletePrompt, useUserProjects, useUserQueries } from '@/features/Projects/hooks/customHooks';
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
import WarningModal from '@/features/Common/components/WarningModal/WarningModal';

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
      if(tabName !== 'Queries') {
        setSelectedProjects([]);
        setSelectedQueries([]);
      }
    }
  };

  const [isDeleteProjectsPromptOpen, setIsDeleteProjectsPromptOpen] = useState(false);
  const [isDeleteQueriesPromptOpen, setIsDeleteQueriesPromptOpen] = useState(false);
  const [isPermanentDeleteProjectPromptOpen, setIsPermanentDeleteProjectPromptOpen] = useState(false);
  const [isPermanentDeleteQueryPromptOpen, setIsPermanentDeleteQueryPromptOpen] = useState(false);

  const { shouldShow: shouldShowDeleteProjectsPrompt, setHideDeletePrompt: setHideDeleteProjectsPrompt } = useShouldShowDeletePrompt('hideDeleteProjectsPrompt', true);
  const { shouldShow: shouldShowPermanentDeleteProjectPrompt, setHideDeletePrompt: setHidePermanentDeleteProjectPrompt } = useShouldShowDeletePrompt('hidePermanentDeleteProjectPrompt', true);
  const { shouldShow: shouldShowDeleteQueriesPrompt, setHideDeletePrompt: setHideDeleteQueriesPrompt } = useShouldShowDeletePrompt('hideDeleteQueriesPrompt', true);
  const { shouldShow: shouldShowPermanentDeleteQueryPrompt, setHideDeletePrompt: setHidePermanentDeleteQueryPrompt } = useShouldShowDeletePrompt('hidePermanentDeleteQueryPrompt', true);

  const handleDeleteSelectedProjects = () => {
    selectedProjects.forEach((project: Project) => projectEditHandlers.handleDeleteProject(project));
    setIsDeleteProjectsPromptOpen(false);
    setSelectedProjects([]);
  };
  const handleDeleteSelectedQueries = () => {
    selectedQueries.forEach((query: UserQueryObject) => queryEditHandlers.handleDeleteQuery(query));
    setIsDeleteQueriesPromptOpen(false);
    setSelectedQueries([]);
  };

  const handleInitiateDelete = () => {
    if(selectedProjects.length > 0) {
      if(shouldShowDeleteProjectsPrompt)
        setIsDeleteProjectsPromptOpen(true);
      else
        handleDeleteSelectedProjects();
    }
    if(selectedQueries.length > 0) {
      if(shouldShowDeleteQueriesPrompt)
        setIsDeleteQueriesPromptOpen(true);
      else
        handleDeleteSelectedQueries();
    }
  };

  const handleInitiatePermanentDeleteProject = (project: Project) => {
    setSelectedProjects([project]);
    if(shouldShowPermanentDeleteProjectPrompt)
      setIsPermanentDeleteProjectPromptOpen(true);
    else
      projectEditHandlers.handlePermanentDeleteProject(project);
  };

  const handlePermanentDeleteProject = () => {
    setIsPermanentDeleteProjectPromptOpen(false);
    projectEditHandlers.handlePermanentDeleteProject(selectedProjects[0]);
    setSelectedProjects([]);
  };

  const handleCancelClosePermanentDeleteProject = () => {
    setIsPermanentDeleteProjectPromptOpen(false);
    setSelectedProjects([]);
  };

  const handleInitiatePermanentDeleteQuery = (query: UserQueryObject) => {
    setSelectedQueries([query]);
    if(shouldShowPermanentDeleteQueryPrompt)
      setIsPermanentDeleteQueryPromptOpen(true);
    else
      queryEditHandlers.handlePermanentDeleteQuery(query);
  };

  const handlePermanentDeleteQuery = () => {
    setIsPermanentDeleteQueryPromptOpen(false);
    queryEditHandlers.handlePermanentDeleteQuery(selectedQueries[0]);
    setSelectedQueries([]);
  };

  const handleCancelClosePermanentDeleteQuery = () => {
    setIsPermanentDeleteQueryPromptOpen(false);
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

  const projectsEmpty = sortedActiveProjects.length === 0 || (sortedActiveProjects.length === 1 && sortedActiveProjects.some(p => isUnassignedProject(p)));

  const onCreateNewProjectClick = () => {
    handleSetIsEditingProject(true, {
      id: '',
      name: '',
      queryIds: [],
      type: 'project',
      status: 'new'
    });
  };

  // reset active tab back to projects when editing is finished
  useEffect(() => {
    if (!projectEditState.isEditing) {
      setActiveTab('Projects');
    }
  }, [projectEditState.isEditing]);

  return (
    <div className={`${styles.projectListContainer} ${projectEditState.isEditing ? styles.isEditing : ''}`}>
      {/* Delete Project Prompt */}
      <WarningModal
        isOpen={isDeleteProjectsPromptOpen}
        onClose={() => {
          setIsDeleteProjectsPromptOpen(false);
          setSelectedProjects([]);
        }}
        onConfirm={handleDeleteSelectedProjects}
        onCancel={() => {
          setIsDeleteProjectsPromptOpen(false);
          setSelectedProjects([]);
        }}
        heading={`Delete ${selectedProjects.length} project${selectedProjects.length > 1 ? 's' : ''}?`}
        content={`${selectedProjects.length > 1 ? 'These projects can be recovered from your Trash.' : 'This project can be recovered from your Trash.'}`}
        cancelButtonText="Cancel"
        confirmButtonText={`Delete Project${selectedProjects.length > 1 ? 's' : ''}`}
        setStorageKeyFn={setHideDeleteProjectsPrompt}
      />
      {/* Delete Query Prompt */}
      <WarningModal
        isOpen={isDeleteQueriesPromptOpen}
        onClose={() => setIsDeleteQueriesPromptOpen(false)}
        onConfirm={handleDeleteSelectedQueries}
        onCancel={() => setIsDeleteQueriesPromptOpen(false)}
        heading={`Delete ${selectedQueries.length} quer${selectedQueries.length > 1 ? 'ies' : 'y'}?`}
        content={`${selectedQueries.length > 1 ? 'These queries can be recovered from your Trash.' : 'This query can be recovered from your Trash.'}`}
        cancelButtonText="Cancel"
        confirmButtonText={`Delete Quer${selectedQueries.length > 1 ? 'ies' : 'y'}`}
        setStorageKeyFn={setHideDeleteQueriesPrompt}
      />
      {/* Permanent Delete Project Prompt */}
      <WarningModal
        isOpen={isPermanentDeleteProjectPromptOpen}
        onClose={handleCancelClosePermanentDeleteProject}
        onConfirm={handlePermanentDeleteProject}
        onCancel={handleCancelClosePermanentDeleteProject}
        heading={`Permanently Delete Project?`}
        content={`This action cannot be undone.`}
        cancelButtonText="Cancel"
        confirmButtonText={`Delete Project`}
        setStorageKeyFn={setHidePermanentDeleteProjectPrompt}
      />
      {/* Permanent Delete Query Prompt */}
      <WarningModal
        isOpen={isPermanentDeleteQueryPromptOpen}
        onClose={handleCancelClosePermanentDeleteQuery}
        onConfirm={handlePermanentDeleteQuery}
        onCancel={handleCancelClosePermanentDeleteQuery}
        heading={`Permanently Delete Query?`}
        content={`This action cannot be undone.`}
        cancelButtonText="Cancel"
        confirmButtonText={`Delete Query`}
        setStorageKeyFn={setHidePermanentDeleteQueryPrompt}
      />
      <EditQueryModal
        currentEditingQueryItem={queryEditState.editingItem?.type === 'query' ? queryEditState.editingItem : undefined}
        handleClose={() => setIsEditQueryModalOpen(false)}
        isOpen={isEditQueryModalOpen}
        loading={queriesLoading}
        mode="edit"
        projects={activeFormattedProjects}
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
            onCreateNewClick={onCreateNewProjectClick}
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
                                  {projectsEmpty ? (
                                    <div className={styles.emptyState}>
                                      {
                                        searchTerm.length > 0 
                                        ? 
                                          (
                                            <p>No matches found.</p>
                                          )
                                        :
                                          (
                                            <>
                                              <h6>No Projects</h6>
                                              <p>
                                                <span className={styles.link} onClick={onCreateNewProjectClick}>Create a New Project</span> to start organizing your queries.<br/>
                                                You can also add queries to a new project from the <span className={styles.link} onClick={() => setActiveTab('Queries')}>Queries</span> tab.
                                              </p>
                                            </>
                                          )
                                      }
                                    </div>
                                  ) : (
                                    <>
                                      {sortedActiveProjects.map((project: Project, index: number) => {
                                        const isLast = index === sortedActiveProjects.length - 1 && isUnassignedProject(project);
                                        if(isLast) 
                                          return null;

                                        return (
                                          <ProjectCard 
                                            key={project.id}
                                            queries={queries}
                                            project={project}
                                            searchTerm={searchTerm}
                                            setSelectedProjects={setSelectedProjects}
                                            selectedProjects={selectedProjects}
                                            onEdit={projectEditHandlers.handleEditProject}
                                            onDelete={handleInitiatePermanentDeleteProject}
                                            queriesLoading={queriesLoading}
                                          />
                                        )
                                      })}
                                    </>
                                  )}
                                  {
                                    sortedActiveProjects.length > 0 && isUnassignedProject(sortedActiveProjects[sortedActiveProjects.length - 1]) && (
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
                                          onEdit={projectEditHandlers.handleEditProject}
                                          queriesLoading={queriesLoading}
                                        />
                                      </>
                                    )
                                  }
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
                                            <>
                                              <h6>No Queries</h6>
                                              <p>
                                                Your bookmarks and notes are saved here when you run a <a href="/" target="_blank" className={styles.link}>New Query</a>.
                                              </p>
                                            </>
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
                                        onDelete={handleInitiatePermanentDeleteQuery}
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
                            {sortedDeletedProjects.length > 0 && (
                              <div className={styles.deletedWrapper}>
                                <LoadingWrapper
                                  loading={projectsLoading}
                                  wrapperClassName={styles.loadingWrapper}
                                  spinnerClassName={styles.loadingSpinner}
                                >
                                  <div className={styles.projectGrid}>
                                    {
                                      sortedDeletedProjects.map((project: Project) => (
                                        <ProjectCard 
                                          key={project.id}
                                          queries={queries}
                                          project={project}
                                          searchTerm={searchTerm}
                                          setSelectedProjects={setSelectedProjects}
                                          selectedProjects={selectedProjects}
                                          queriesLoading={queriesLoading}
                                          onDelete={handleInitiatePermanentDeleteProject}
                                        />
                                      ))
                                    }
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
                                    {
                                      sortedDeletedQueries.map((query: UserQueryObject) => (
                                        <QueryCard 
                                          key={query.data.qid}
                                          query={query}
                                          searchTerm={searchTerm}
                                          setSelectedQueries={setSelectedQueries}
                                          selectedQueries={selectedQueries}
                                          onDelete={handleInitiatePermanentDeleteQuery}
                                        />
                                      ))
                                    }
                                  </div>
                                </LoadingWrapper>
                              </div>
                            )}
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
                        handleClick={handleInitiateDelete}
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