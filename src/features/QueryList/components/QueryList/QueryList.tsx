import { useState } from "react";
import styles from '@/features/QueryList/components/QueryList/QueryList.module.scss';
import QueriesTab from "@/features/Projects/components/Tabs/QueriesTab/QueriesTab";
import ProjectModals from "@/features/Projects/components/ProjectModals/ProjectModals";
import ProjectHeader from "@/features/Projects/components/ProjectHeader/ProjectHeader";
import Tabs from "@/features/Common/components/Tabs/Tabs";
import Tab from "@/features/Common/components/Tabs/Tab";
import TrashTab from "@/features/Projects/components/Tabs/TrashTab/TrashTab";
import { useProjectDetailSortSearchSelectState } from "@/features/Projects/hooks/customHooks";
import { useProjectListData } from "@/features/Projects/hooks/useProjectListData";
import { useAllDeletePrompts } from '@/features/Projects/hooks/useDeletePrompts';
import { useModals } from "@/features/Projects/hooks/useModals";
import { useFilteredAndSortedData } from "@/features/Projects/hooks/useFilteredAndSortedData";
import { useEditQueryHandlers, useEditQueryState } from "@/features/Projects/utils/editUpdateFunctions";
import { QueryEditingItem, UserQueryObject } from "@/features/Projects/types/projects.d";
import { useDeletionHandlers } from "@/features/Projects/hooks/useDeletionHandlers";
import SelectedItemsActionBar from "@/features/Projects/components/SelectedItemsActionBar/SelectedItemsActionBar";

const QueryList = () => {
  const data = useProjectListData();
  const projectListState = useProjectDetailSortSearchSelectState();
  const deletePrompts = useAllDeletePrompts();
  const modals = useModals({
    deleteQueries: false,
    permanentDeleteQuery: false,
    permanentDeleteSelected: false,
    emptyTrash: false,
    shareQuery: false
  });
  const [queryEditState, setQueryEditState] = useEditQueryState();
  const [isEditQueryModalOpen, setIsEditQueryModalOpen] = useState(false);
  const [sharedQuery, setSharedQuery] = useState<UserQueryObject | null>(null);
  const [activeTab, setActiveTab] = useState<string>('Queries');

  const handleSetIsEditingQuery = (isEditing: boolean, editingItem?: QueryEditingItem) => {
    setQueryEditState({isEditing: isEditing, editingItem: editingItem || undefined});
    if(isEditing && editingItem?.type === 'query')
      setIsEditQueryModalOpen(true);
    else 
      setIsEditQueryModalOpen(false);
  };

  const queryEditHandlers = useEditQueryHandlers(handleSetIsEditingQuery, data.filtered.active.queries);

  const deletionHandlers = useDeletionHandlers({
    projectEditHandlers: undefined as any,
    queryEditHandlers,
    modals,
    selections: { 
      selectedProjects: [], 
      selectedQueries: projectListState.selectedQueries,
      setSelectedProjects: () => {},
      setSelectedQueries: projectListState.setSelectedQueries
    },
    prompts: deletePrompts
  });

  const sortedData = useFilteredAndSortedData({
    activeProjects: [],
    deletedProjects: [],
    activeQueries: data.filtered.active.queries,
    deletedQueries: data.filtered.deleted.queries,
    sortField: projectListState.sortField,
    sortDirection: projectListState.sortDirection,
    searchTerm: projectListState.searchTerm
  });

  const handleShareQuery = (query: UserQueryObject) => {
    setSharedQuery(query);
    modals.openModal('shareQuery');
  };

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

  return (
    <div className={`container ${styles.queryListContainer}`}>
      <ProjectHeader
        title="Queries"
        searchTerm={projectListState.searchTerm}
        setSearchTerm={projectListState.setSearchTerm}
        searchPlaceholder="Search by Query Name"
        variant="queries"
        isEditing={false}
        selectedQueries={[]}
        setProjectEditingState={() => {}}
      />
      <ProjectModals 
        modals={modals.modals}
        selectedProjects={[]}
        selectedQueries={projectListState.selectedQueries}
        onCloseModal={(modalType: string) => modals.closeModal(modalType as unknown as keyof typeof modals.modals)}
        setSelectedProjects={() => {}}
        deletionHandlers={deletionHandlers}
        deletePrompts={deletePrompts}
        editQueryModal={{
          currentEditingQueryItem: queryEditState.editingItem?.type === 'query' ? queryEditState.editingItem : undefined,
          handleClose: () => setIsEditQueryModalOpen(false),
          isOpen: isEditQueryModalOpen,
          loading: data.loading.queriesLoading,
          mode: 'edit',
          projects: [],
          queries: data.raw.queries
        }}  
        shareQueryModal={{
          onClose: () => {
            setSharedQuery(null);
            modals.closeModal('shareQuery');
          },
          sharedQuery: sharedQuery
        }}
      />
      <div className={styles.queryListInner}>
        <Tabs 
          isOpen={true}
          handleTabSelection={handleTabSelection}
          defaultActiveTab="Queries"
          className={styles.projectTabs}
          tabListClassName={styles.projectTabsList}
          activeTab={activeTab}
          controlled={true}
        >
          <Tab heading="Queries" className={styles.queryTabContent}>
            <QueriesTab
              sortedActiveQueries={sortedData.sortedActiveQueries}
              projectListState={projectListState}
              queriesError={data.errors.queriesError}
              queriesLoading={data.loading.queriesLoading}
              onEditQuery={queryEditHandlers.handleEditQuery}
              onDeleteQuery={deletionHandlers.handleInitiateDeleteQuery}
              onShareQuery={handleShareQuery}
              styles={styles}
              location="queries"
            />
          </Tab>
          <Tab heading="Trash" className={styles.queryTabContent}>
            <TrashTab
              sortedDeletedProjects={sortedData.sortedDeletedProjects}
              sortedDeletedQueries={sortedData.sortedDeletedQueries}
              projectListState={projectListState}
              projectsLoading={false}
              queriesLoading={data.loading.queriesLoading}
              queries={data.raw.queries}
              rawProjects={[]}
              onDeleteProject={() => {}}
              onDeleteQuery={deletionHandlers.handleInitiatePermanentDeleteQuery}
              styles={styles}
              location="trash"
            />
          </Tab>
        </Tabs>
        <SelectedItemsActionBar
          selectedProjects={[]}
          selectedQueries={projectListState.selectedQueries}
          activeTab={activeTab}
          projectEditingState={{ isEditing: false }}
          onDeleteSelected={deletionHandlers.handleInitiateDelete}
          onPermanentDeleteSelected={deletionHandlers.handleInitiatePermanentDeleteSelected}
          onEmptyTrash={deletionHandlers.handleInitiateEmptyTrash}
          onAddToProject={() => {console.log('TODO: add to project')}} // TODO: implement
        />
      </div>
      {/* <QueriesTab
        sortedActiveQueries={sortedData.sortedActiveQueries}
        projectListState={projectListState}
        queriesError={data.errors.queriesError}
        queriesLoading={data.loading.queriesLoading}
        onEditQuery={queryEditHandlers.handleEditQuery}
        onDeleteQuery={deletionHandlers.handleInitiateDeleteQuery}
        onShareQuery={handleShareQuery}
        styles={styles}
        location="queries"
      /> */}
    </div>
  );
}

export default QueryList;