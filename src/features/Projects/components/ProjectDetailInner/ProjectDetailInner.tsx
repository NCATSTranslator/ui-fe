import { useCallback, useMemo, useState } from 'react';
import styles from './ProjectDetailInner.module.scss';
import QueriesTableHeader from '@/features/Projects/components/TableHeader/QueriesTableHeader/QueriesTableHeader';
import QueryCard from '@/features/Projects/components/QueryCard/QueryCard';
import LoadingWrapper from '@/features/Common/components/LoadingWrapper/LoadingWrapper';
import { useProjectDetailSortSearchSelectState } from '@/features/Projects/hooks/customHooks';
import { isUserQueryObject, ProjectEditingItem, QueryEditingItem, UserQueryObject } from '@/features/Projects/types/projects.d';
import ProjectHeader from '@/features/Projects/components/ProjectHeader/ProjectHeader';
import Tabs from '@/features/Common/components/Tabs/Tabs';
import Tab from '@/features/Common/components/Tabs/Tab';
import { useEditProjectState, useEditProjectHandlers, useEditQueryState, useEditQueryHandlers, onSetIsEditingProject, isUnassignedProject } from '@/features/Projects/utils/editUpdateFunctions';
import ProjectDetailErrorStates from '@/features/Projects/components/ProjectDetailErrorStates/ProjectDetailErrorStates';
import { useProjectDetailData } from '@/features/Projects/hooks/useProjectDetailData';
import { useProjectDetailSortedData } from '@/features/Projects/hooks/useProjectDetailSortedData';
import SelectedItemsActionBar from '../SelectedItemsActionBar/SelectedItemsActionBar';
import { getProjectDetailHeaderSubtitle } from '@/features/Projects/utils/utilities';
import { DroppableArea } from '@/features/DragAndDrop/components/DroppableArea/DroppableArea';
import { DraggableData } from '@/features/DragAndDrop/types/types';
import { handleQueryDrop } from '@/features/Projects/utils/dragDropUtils';
import { useDndContext } from '@dnd-kit/core';
import { useProjectModals } from '@/features/Projects/hooks/useProjectModals';

const ProjectDetailInner = () => {
  // Data management
  const data = useProjectDetailData();

  // drag and drop context
  const { active } = useDndContext();

  const isDraggedQueryInProject = useMemo(() => {
    if(!active || !active.data.current) return false;
    const draggedQid = active.data.current.data.data.qid;
    const projectQids = data.project?.data.pks || [];
    return active.data.current.type === 'query' && projectQids.includes(draggedQid);
  }, [active, data.project]);

  // State management hooks
  const projectListState = useProjectDetailSortSearchSelectState();
  
  // Global modals context
  const {
    openDeleteProjectModal,
    openDeleteQueriesModal,
    openEditQueryModal,
    openShareQueryModal
  } = useProjectModals();

  // Sorted data
  const sortedData = useProjectDetailSortedData({
    rawQueries: data.raw.queries,
    projectQueries: data.projectQueries,
    sortField: projectListState.sortField,
    sortDirection: projectListState.sortDirection,
    searchTerm: projectListState.searchTerm
  });

  // Edit state management
  const [projectEditState, setProjectEditState] = useEditProjectState();
  const [queryEditState, setQueryEditState] = useEditQueryState();
  const [isEditQueryModalOpen, setIsEditQueryModalOpen] = useState(false);
  const [sharedQuery, setSharedQuery] = useState<UserQueryObject | null>(null);

  const isUnassignedPrj = isUnassignedProject(data.project || 0);
  const headerSubtitle = useMemo(() => getProjectDetailHeaderSubtitle(data.project, data.raw.queries), [data.project, data.raw.queries]);

  const handleSetIsEditingQuery = (isEditing: boolean, editingItem?: QueryEditingItem) => {
    setQueryEditState({isEditing: isEditing, editingItem: editingItem || undefined});
    if(isEditing && editingItem?.type === 'query') {
      setIsEditQueryModalOpen(true);
      openEditQueryModal({
        currentEditingQueryItem: editingItem,
        handleClose: () => setIsEditQueryModalOpen(false),
        isOpen: true,
        loading: data.loading.queriesLoading,
        mode: 'edit',
        projects: data.raw.projects,
        queries: data.raw.queries
      });
    } else {
      setIsEditQueryModalOpen(false);
    }
  };


  const handleSetIsEditingProject = (isEditing: boolean, editingItem?: ProjectEditingItem) => {
    onSetIsEditingProject(
      isEditing,
      data.projectQueries,
      setProjectEditState,
      projectListState.setSelectedQueries,
      editingItem
    );
  };

  const projectEditHandlers = useEditProjectHandlers(
    handleSetIsEditingProject, 
    data.project ? [data.project] : []
  );

  const queryEditHandlers = useEditQueryHandlers(
    handleSetIsEditingQuery, 
    data.projectQueries
  );
  
  const handleEditClick = () => {
    if (data.project) {
      projectEditHandlers.handleEditProject(data.project);
    }
  };

  const handleShareQuery = (query: UserQueryObject) => {
    setSharedQuery(query);
    openShareQueryModal(query);
  };

  const handleInitiateDeleteProject = () => {
    if (data.project) {
      openDeleteProjectModal(data.project);
    }
  };

  const handleInitiateDeleteSelectedQueries = () => {
    if (projectListState.selectedQueries.length > 0) {
      openDeleteQueriesModal(projectListState.selectedQueries);
    }
  };

  const onQueryDrop = useCallback((draggedItem: DraggableData) => {
    if(data.project)
      handleQueryDrop(draggedItem, data.project, data.project?.data.pks, projectEditHandlers.handleUpdateProject);
    else
      console.error('No project found');
  }, [data.project, data.project?.data.pks, projectEditHandlers.handleUpdateProject]);

  return (
    <div className={styles.projectDetail}>
      {
        data.errors.projectsError
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
                <LoadingWrapper loading={data.loading.projectsLoading} >
                  <ProjectHeader
                    backButtonText="All Projects"
                    bookmarkCount={data.project?.bookmark_count || 0}
                    isEditing={projectEditState.isEditing}
                    noteCount={data.project?.note_count || 0}
                    onCancelEdit={projectEditHandlers.handleCancelEdit}
                    onDeleteProject={handleInitiateDeleteProject}
                    onEditClick={handleEditClick}
                    onRestoreProject={projectEditHandlers.handleRestoreProject}
                    onUpdateProjectItem={projectEditHandlers.handleUpdateProject}
                    project={data.project}
                    projectEditingItem={projectEditState.editingItem}
                    queriesLoading={data.loading.queriesLoading}
                    searchPlaceholder="Search by Query Name"
                    searchTerm={projectListState.searchTerm}
                    selectedQueries={projectListState.selectedQueries}
                    setProjectEditingState={handleSetIsEditingProject}
                    setSearchTerm={projectListState.setSearchTerm}
                    showBackButton={true}
                    subtitle={headerSubtitle}
                    title={data.project?.data.title || ''}
                  />
                </LoadingWrapper>
              </div>
              <div className={styles.projectTabsContainer}>
                <Tabs 
                  isOpen={true}
                  handleTabSelection={() => {}}
                  defaultActiveTab="Queries"
                  className={styles.projectTabs}
                >
                  {[
                    <Tab key="queries" heading={`${sortedData.sortedQueries.length} Quer${sortedData.sortedQueries.length === 1 ? 'y' : 'ies'}`} className={styles.projectTabContent}>
                      <DroppableArea 
                        id="project-zone"
                        canAccept={(draggedData) => draggedData.type === 'query'}
                        disabled={isUnassignedProject(data.project || -1)}
                        data={{ 
                          id: data.project?.id?.toString(),
                          type: 'project',
                          onDrop: onQueryDrop
                        }}
                        indicatorText={`${isDraggedQueryInProject ? 'Query Already in Project' : 'Add to Project'}`}
                        indicatorStatus={isDraggedQueryInProject ? 'error' : 'default'}
                      >
                        {sortedData.sortedQueries.length > 0 && (
                          <QueriesTableHeader
                            activeQueries={sortedData.sortedQueries}
                            selectedQueries={projectListState.selectedQueries}
                            setSelectedQueries={projectListState.setSelectedQueries}
                            sortField={projectListState.sortField}
                            sortDirection={projectListState.sortDirection}
                            onSort={projectListState.handleSort}
                            location="detail"
                            isEditing={projectEditState.isEditing}
                            isUnassigned={isUnassignedPrj}
                          />
                        )}
                        {
                          data.errors.queriesError
                          ?
                            (
                              <ProjectDetailErrorStates
                                type="queries"
                                styles={styles}
                              />
                            )
                          : 
                            (
                              <LoadingWrapper loading={data.loading.queriesLoading}>
                                <div className={styles.queryGrid}>
                                  {sortedData.sortedQueries.length === 0 ? (
                                    <div className={styles.emptyState}>
                                      <p>No queries found{projectListState.searchTerm ? ' matching your search.' : '.'}</p>
                                    </div>
                                  ) : (
                                    sortedData.sortedQueries.map((query) => (
                                      <QueryCard
                                        key={query.data.qid}
                                        queries={data.raw.queries}
                                        query={query}
                                        searchTerm={projectListState.searchTerm}
                                        setSelectedQueries={projectListState.setSelectedQueries}
                                        selectedQueries={projectListState.selectedQueries}
                                        onEdit={queryEditHandlers.handleEditQuery}
                                        isEditing={projectEditState.isEditing}
                                        location="detail"
                                        inUnassignedProject={isUnassignedPrj}
                                        onShare={handleShareQuery}
                                      />
                                    ))
                                  )}
                                  {
                                    (projectEditState.isEditing && sortedData.additionalQueries.length > 0) && (
                                      <>
                                        <div className={styles.separator} />
                                        <p className={styles.additionalQueriesLabel}>Select to Add to Project</p>
                                        {
                                          sortedData.additionalQueries.map((query) => (
                                            <QueryCard
                                              key={query.data.qid}
                                              queries={data.raw.queries}
                                              query={query}
                                              searchTerm={projectListState.searchTerm}
                                              setSelectedQueries={projectListState.setSelectedQueries}
                                              selectedQueries={projectListState.selectedQueries}
                                              onEdit={queryEditHandlers.handleEditQuery}
                                              isEditing={projectEditState.isEditing}
                                              location="detail"
                                              inUnassignedProject={isUnassignedPrj}
                                              onShare={handleShareQuery}
                                            />
                                          ))
                                        }
                                      </>
                                    )
                                  }
                                </div>
                              </LoadingWrapper>
                            )
                        }
                      </DroppableArea>
                    </Tab>
                  ]}
                </Tabs>
                {
                  isUnassignedPrj && (
                    <SelectedItemsActionBar
                      selectedProjects={[]}
                      selectedQueries={projectListState.selectedQueries}
                      activeTab="queries"
                      projectEditingState={projectEditState}
                      onDeleteSelected={handleInitiateDeleteSelectedQueries}
                      onPermanentDeleteSelected={() => {console.log('TODO: permanent delete selected')}} // TODO: implement
                      onEmptyTrash={() => {console.log('TODO: empty trash')}} // TODO: implement
                      onAddToProject={() => {console.log('TODO: add to project')}} // TODO: implement
                    />
                  )
                }
              </div>
            </>
          )
      }
    </div>
  );
};

export default ProjectDetailInner;