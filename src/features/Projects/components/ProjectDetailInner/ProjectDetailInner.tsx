import styles from './ProjectDetailInner.module.scss';
import QueriesTableHeader from '@/features/Projects/components/TableHeader/QueriesTableHeader/QueriesTableHeader';
import QueryCard from '@/features/Projects/components/QueryCard/QueryCard';
import LoadingWrapper from '@/features/Common/components/LoadingWrapper/LoadingWrapper';
import { useProjectDetailSortSearchSelectState } from '@/features/Projects/hooks/customHooks';
import { ProjectEditingItem, QueryEditingItem } from '@/features/Projects/types/projects.d';
import ProjectHeader from '@/features/Projects/components/ProjectHeader/ProjectHeader';
import Tabs from '@/features/Common/components/Tabs/Tabs';
import Tab from '@/features/Common/components/Tabs/Tab';
import { useEditProjectState, useEditProjectHandlers, useEditQueryState, useEditQueryHandlers, onSetIsEditingProject } from '@/features/Projects/utils/editUpdateFunctions';
import ProjectDetailErrorStates from '@/features/Projects/components/ProjectDetailErrorStates/ProjectDetailErrorStates';
import ProjectDeleteWarningModal from '@/features/Projects/components/ProjectDeleteWarningModal/ProjectDeleteWarningModal';
import { useProjectDetailData } from '@/features/Projects/hooks/useProjectDetailData';
import { useProjectDetailSortedData } from '@/features/Projects/hooks/useProjectDetailSortedData';
import { useProjectDetailDeletePrompts } from '@/features/Projects/hooks/useDeletePrompts';
import { useModals } from '@/features/Projects/hooks/useModals';
import { useProjectDetailDeletionHandlers } from '@/features/Projects/hooks/useProjectDetailDeletionHandlers';

const ProjectDetailInner = () => {
  // Data management
  const data = useProjectDetailData();
  
  // State management hooks
  const projectListState = useProjectDetailSortSearchSelectState();
  const deletePrompts = useProjectDetailDeletePrompts();
  const modals = useModals({
    deleteProject: false
  });

  // Sorted data
  const sortedData = useProjectDetailSortedData({
    projectQueries: data.projectQueries,
    sortField: projectListState.sortField,
    sortDirection: projectListState.sortDirection,
    searchTerm: projectListState.searchTerm
  });

  // Edit state management
  const [projectEditState, setProjectEditState] = useEditProjectState();
  const [queryEditState, setQueryEditState] = useEditQueryState();

  const handleSetIsEditingQuery = (isEditing: boolean, editingItem?: QueryEditingItem) => {
    setQueryEditState(prev => ({ 
      ...prev, 
      isEditing, 
      ...(editingItem !== undefined && { editingItem })
    }));
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

  // Deletion handlers
  const deletionHandlers = useProjectDetailDeletionHandlers({
    projectEditHandlers,
    modals,
    prompts: deletePrompts
  });
  
  const handleEditClick = () => {
    if (data.project) {
      projectEditHandlers.handleEditProject(data.project);
    }
  };

  return (
    <div className={styles.projectDetail}>
      <ProjectDeleteWarningModal
        isOpen={modals.modals.deleteProject}
        onClose={deletionHandlers.handleCancelDeleteProject}
        onConfirm={() => {
          if(data.project)
            deletionHandlers.handleDeleteProject(data.project);
        }}
        onCancel={deletionHandlers.handleCancelDeleteProject}
        heading={`Delete project?`}
        content={`'This project can be recovered from your Trash.`}
        cancelButtonText="Cancel"
        confirmButtonText={`Delete Project`}
        setStorageKeyFn={deletePrompts.deleteProjects.setHideDeletePrompt}
      />
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
                    onDeleteProject={() => {
                      if(data.project)
                        deletionHandlers.handleInitiateDeleteProject(data.project);
                    }}
                    onDeleteQuery={queryEditHandlers.handleDeleteQuery}
                    onEditClick={handleEditClick}
                    onRestoreProject={projectEditHandlers.handleRestoreProject}
                    onRestoreQuery={queryEditHandlers.handleRestoreQuery}
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
                    subtitle={`${data.project?.data.pks.length || "-"} Quer${data.project?.data.pks.length === 1 ? 'y' : 'ies'}`}
                    title={data.project?.data.title || ''}
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
                                    query={query}
                                    searchTerm={projectListState.searchTerm}
                                    setSelectedQueries={projectListState.setSelectedQueries}
                                    selectedQueries={projectListState.selectedQueries}
                                    onEdit={queryEditHandlers.handleEditQuery}
                                    isEditing={projectEditState.isEditing}
                                    location="detail"
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