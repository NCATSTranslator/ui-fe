import { useEffect, useState } from 'react';
import styles from '@/features/Projects/components/ProjectListInner/ProjectListInner.module.scss';
import ProjectHeader from '@/features/Projects/components/ProjectHeader/ProjectHeader';
import Tabs from '@/features/Common/components/Tabs/Tabs';
import Tab from '@/features/Common/components/Tabs/Tab';
import { useProjectDetailSortSearchSelectState } from '@/features/Projects/hooks/customHooks';
import { ProjectEditingItem, QueryEditingItem, UserQueryObject } from '@/features/Projects/types/projects.d';
import { useEditProjectState, useEditProjectHandlers, useEditQueryState, useEditQueryHandlers, onSetIsEditingProject } from '@/features/Projects/utils/editUpdateFunctions';

import { useProjectListData } from '@/features/Projects/hooks/useProjectListData';
import { useFilteredAndSortedData } from '@/features/Projects/hooks/useFilteredAndSortedData';
import { useAllDeletePrompts } from '@/features/Projects/hooks/useDeletePrompts';
import { useModals } from '@/features/Projects/hooks/useModals';
import { useDeletionHandlers } from '@/features/Projects/hooks/useDeletionHandlers';
import ProjectsTab from '@/features/Projects/components/Tabs/ProjectsTab/ProjectsTab';
import QueriesTab from '@/features/Projects/components/Tabs/QueriesTab/QueriesTab';
import TrashTab from '@/features/Projects/components/Tabs/TrashTab/TrashTab';
import ProjectModals from '@/features/Projects/components/ProjectModals/ProjectModals';
import SelectedItemsActionBar from '@/features/Projects/components/SelectedItemsActionBar/SelectedItemsActionBar';

export const ProjectListInner = () => {
  const data = useProjectListData();
  const projectListState = useProjectDetailSortSearchSelectState();
  const deletePrompts = useAllDeletePrompts();
  const modals = useModals({
    deleteProjects: false,
    deleteQueries: false,
    permanentDeleteProject: false,
    permanentDeleteQuery: false,
    permanentDeleteSelected: false,
    emptyTrash: false,
    shareQuery: false
  });
  
  const [activeTab, setActiveTab] = useState<string>('Projects');

  const [projectEditState, setProjectEditState] = useEditProjectState();
  const [queryEditState, setQueryEditState] = useEditQueryState();
  const [isEditQueryModalOpen, setIsEditQueryModalOpen] = useState(false);
  const [sharedQuery, setSharedQuery] = useState<UserQueryObject | null>(null);

  const handleSetIsEditingProject = (isEditing: boolean, editingItem?: ProjectEditingItem) => {
    onSetIsEditingProject(
      isEditing,
      data.filtered.active.queries,
      setProjectEditState,
      projectListState.setSelectedQueries,
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

  const projectEditHandlers = useEditProjectHandlers(handleSetIsEditingProject, data.formatted.active);
  const queryEditHandlers = useEditQueryHandlers(handleSetIsEditingQuery, data.filtered.active.queries);

  const sortedData = useFilteredAndSortedData({
    activeProjects: data.formatted.active,
    deletedProjects: data.formatted.deleted,
    activeQueries: data.filtered.active.queries,
    deletedQueries: data.filtered.deleted.queries,
    sortField: projectListState.sortField,
    sortDirection: projectListState.sortDirection,
    searchTerm: projectListState.searchTerm
  });

  const deletionHandlers = useDeletionHandlers({
    projectEditHandlers,
    queryEditHandlers,
    modals,
    selections: { 
      selectedProjects: projectListState.selectedProjects, 
      selectedQueries: projectListState.selectedQueries,
      setSelectedProjects: projectListState.setSelectedProjects,
      setSelectedQueries: projectListState.setSelectedQueries
    },
    prompts: deletePrompts
  });

  const handleTabSelection = (tabName: string) => {
    if(activeTab != tabName) {
      setActiveTab(tabName);
      if(tabName !== 'Queries') {
        projectListState.setSelectedProjects([]);
        projectListState.setSelectedQueries([]);
      } else {
        projectListState.setSelectedProjects([]);
      }
    }
  };

  const hideProjectsTab = sortedData.tabVisibility.hideProjectsTab || projectEditState.isEditing;
  const hideQueriesTab = sortedData.tabVisibility.hideQueriesTab;
  const hideTrashTab = sortedData.tabVisibility.hideTrashTab || projectEditState.isEditing;
  const hideAllTabs = hideProjectsTab && hideQueriesTab && hideTrashTab;

  const onCreateNewProjectClick = () => {
    handleSetIsEditingProject(true, {
      id: '',
      name: '',
      queryIds: [],
      type: 'project',
      status: 'new'
    });
  };

  const handleShareQuery = (query: UserQueryObject) => {
    setSharedQuery(query);
    modals.openModal('shareQuery');
  };

  // reset active tab back to projects when editing is finished
  useEffect(() => {
    if (!projectEditState.isEditing) {
      setActiveTab('Projects');
    }
  }, [projectEditState.isEditing]);

  return (
    <div className={`${styles.projectListContainer} ${projectEditState.isEditing ? styles.isEditing : ''}`}>
      <ProjectModals 
        modals={modals.modals}
        selectedProjects={projectListState.selectedProjects}
        selectedQueries={projectListState.selectedQueries}
        onCloseModal={(modalType: string) => modals.closeModal(modalType as unknown as keyof typeof modals.modals)}
        setSelectedProjects={projectListState.setSelectedProjects}
        setSelectedQueries={projectListState.setSelectedQueries}
        deletionHandlers={deletionHandlers}
        deletePrompts={deletePrompts}
        editQueryModal={{
          currentEditingQueryItem: queryEditState.editingItem?.type === 'query' ? queryEditState.editingItem : undefined,
          handleClose: () => setIsEditQueryModalOpen(false),
          isOpen: isEditQueryModalOpen,
          loading: data.loading.queriesLoading,
          mode: 'edit',
          projects: data.formatted.active
        }}  
        shareQueryModal={{
          onClose: () => {
            setSharedQuery(null);
            modals.closeModal('shareQuery');
          },
          sharedQuery: sharedQuery
        }}
      />
      <div className="container">
        <div className={styles.projectList}>
          <ProjectHeader
            title={`${projectEditState.isEditing ? "Edit Project" : "Projects"}`}
            searchTerm={projectListState.searchTerm}
            setSearchTerm={projectListState.setSearchTerm}
            searchPlaceholder="Search by Project or Query Name"
            showCreateButton={true}
            variant="list"
            isEditing={projectEditState.isEditing}
            setProjectEditingState={handleSetIsEditingProject}
            projectEditingItem={projectEditState.editingItem}
            onUpdateProjectItem={projectEditHandlers.handleUpdateProject}
            onCancelEdit={projectEditHandlers.handleCancelEdit}
            selectedQueries={projectListState.selectedQueries}
            onCreateNewClick={onCreateNewProjectClick}
            onDeleteProject={deletionHandlers.handleInitiateDeleteSingleProject}
            project={projectEditState.editingItem?.type === 'project' ? data.formatted.active.find(p => projectEditState.editingItem && p.id === parseInt(projectEditState.editingItem.id)): undefined}
          />
          {hideAllTabs ? (
            <div className={styles.emptyState}>
              <p>No Matches Found</p>
            </div>
          ) : (
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
                {!hideProjectsTab ? (
                  <Tab heading="Projects" className={styles.projectTabContent}>
                    <ProjectsTab
                      sortedActiveProjects={sortedData.sortedActiveProjects}
                      projectListState={projectListState}
                      projectsError={data.errors.projectsError}
                      projectsLoading={data.loading.projectsLoading}
                      queries={data.raw.queries}
                      queriesLoading={data.loading.queriesLoading}
                      projectsEmpty={sortedData.projectsEmpty}
                      onCreateNewProjectClick={onCreateNewProjectClick}
                      onSetActiveTab={setActiveTab}
                      onEditProject={projectEditHandlers.handleEditProject}
                      onDeleteProject={deletionHandlers.handleInitiatePermanentDeleteProject}
                      styles={styles}
                    />
                  </Tab>
                ) : null}
                
                {!hideQueriesTab ? (
                  <Tab heading="Queries" className={styles.projectTabContent}>
                    <QueriesTab
                      sortedActiveQueries={sortedData.sortedActiveQueries}
                      projectListState={projectListState}
                      queriesError={data.errors.queriesError}
                      queriesLoading={data.loading.queriesLoading}
                      onEditQuery={queryEditHandlers.handleEditQuery}
                      onDeleteQuery={deletionHandlers.handleInitiatePermanentDeleteQuery}
                      onShareQuery={handleShareQuery}
                      styles={styles}
                    />
                  </Tab>
                ) : null}
                
                {!hideTrashTab ? (
                  <Tab heading="Trash" className={styles.projectTabContent}>
                    <TrashTab
                      sortedDeletedProjects={sortedData.sortedDeletedProjects}
                      sortedDeletedQueries={sortedData.sortedDeletedQueries}
                      projectListState={projectListState}
                      projectsLoading={data.loading.projectsLoading}
                      queriesLoading={data.loading.queriesLoading}
                      queries={data.raw.queries}
                      onDeleteProject={deletionHandlers.handleInitiatePermanentDeleteProject}
                      onDeleteQuery={deletionHandlers.handleInitiatePermanentDeleteQuery}
                      styles={styles}
                    />
                  </Tab>
                ) : null}
              </Tabs>
              
              <SelectedItemsActionBar
                selectedProjects={projectListState.selectedProjects}
                selectedQueries={projectListState.selectedQueries}
                activeTab={activeTab}
                projectEditingState={projectEditState}
                onDeleteSelected={deletionHandlers.handleInitiateDelete}
                onPermanentDeleteSelected={deletionHandlers.handleInitiatePermanentDeleteSelected}
                onEmptyTrash={deletionHandlers.handleInitiateEmptyTrash}
                onAddToProject={() => {console.log('TODO: add to project')}} // TODO: implement
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};