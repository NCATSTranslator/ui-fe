import { useCallback, useMemo, useState, MouseEvent, useEffect } from 'react';
import styles from './ProjectDetailInner.module.scss';
import QueryCard from '@/features/Projects/components/QueryCard/QueryCard';
import LoadingWrapper from '@/features/Common/components/LoadingWrapper/LoadingWrapper';
import { useSortSearchState } from '@/features/Projects/hooks/customHooks';
import Tabs from '@/features/Common/components/Tabs/Tabs';
import Tab from '@/features/Common/components/Tabs/Tab';
import { useEditProjectHandlers, isUnassignedProject } from '@/features/Projects/utils/editUpdateFunctions';
import ProjectDetailErrorStates from '@/features/Projects/components/ProjectDetailErrorStates/ProjectDetailErrorStates';
import { useProjectDetailData } from '@/features/Projects/hooks/useProjectDetailData';
import { useProjectDetailSortedData } from '@/features/Projects/hooks/useProjectDetailSortedData';
import { DroppableArea } from '@/features/DragAndDrop/components/DroppableArea/DroppableArea';
import { DraggableData } from '@/features/DragAndDrop/types/types';
import { handleQueryDrop } from '@/features/Projects/utils/dragDropUtils';
import { useDndContext } from '@dnd-kit/core';
import { useProjectModals } from '@/features/Projects/hooks/useProjectModals';
import OptionsIcon from '@/assets/icons/buttons/Dot Menu/Vertical Dot Menu.svg?react';
import EditIcon from '@/assets/icons/buttons/Edit.svg?react';
import TrashIcon from '@/assets/icons/buttons/Trash.svg?react';
import OptionsPane from '@/features/Sidebar/components/OptionsPane/OptionsPane';
import Button from '@/features/Core/components/Button/Button';
import ListHeader from '@/features/Core/components/ListHeader/ListHeader';
import QueriesTableHeader from '../TableHeader/QueriesTableHeader/QueriesTableHeader';
import CardList from '@/features/Projects/components/CardList/CardList';
import { useRenameProject } from '@/features/Projects/hooks/useRenameProject';
import SearchPlusIcon from '@/assets/icons/projects/searchplus.svg?react';
import ChevDownIcon from '@/assets/icons/directional/Chevron/Chevron Down.svg?react';
import AnimateHeight from 'react-animate-height';
import CombinedQueryInterface from '@/features/Query/components/CombinedQueryInterface/CombinedQueryInterface';
  
const ProjectDetailInner = () => {
  // Data management
  const data = useProjectDetailData();
  const [optionsOpen, setOptionsOpen] = useState(false);

  // drag and drop context
  const { active } = useDndContext();

  const isDraggedQueryInProject = useMemo(() => {
    if(!active || !active.data.current) return false;
    const draggedQid = active.data.current.data.data.qid;
    const projectQids = data.project?.data.pks || [];
    return active.data.current.type === 'query' && projectQids.includes(draggedQid);
  }, [active, data.project]);

  // State management hooks
  const sortSearchState = useSortSearchState();
  const { handleUpdateProject } = useEditProjectHandlers();

  const [height, setHeight] = useState<number | 'auto'>(0);
  const [addNewQueryOpen, setAddNewQueryOpen] = useState(false);

  useEffect(() => {
    if (addNewQueryOpen === false) {
      setHeight(0);
    } else {
      setHeight('auto');
    }
  }, [addNewQueryOpen])

  // Global modals context
  const {
    openDeleteProjectModal,
  } = useProjectModals();

  // Sorted data
  const sortedData = useProjectDetailSortedData({
    rawQueries: data.raw.queries,
    projectQueries: data.projectQueries,
    sortField: sortSearchState.sortField,
    sortDirection: sortSearchState.sortDirection,
    searchTerm: sortSearchState.searchTerm
  });

  // Rename state management
  const {
    isRenaming,
    localTitle,
    startRenaming,
    handleTitleChange,
    handleFormSubmit,
    handleOutsideClick,
    textInputRef
  } = useRenameProject({
    project: data.project,
    allProjects: data.formatted.projects,
    startRenaming: false,
    onRename: () => {}
  });

  const onQueryDrop = useCallback((draggedItem: DraggableData) => {
    if(data.project)
      handleQueryDrop(draggedItem, data.project, data.project?.data.pks, handleUpdateProject);
    else
      console.error('No project found');
  }, [data.project, data.project?.data.pks, handleUpdateProject]);

  const handleRenameClick = (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.stopPropagation();
    setOptionsOpen(prev => !prev);
    startRenaming();
  }

  const options = (
    <>
      <Button handleClick={handleRenameClick} iconLeft={<EditIcon />}>Rename</Button>
      <Button handleClick={() => {if(data.project) openDeleteProjectModal(data.project)}} iconLeft={<TrashIcon />}>Delete</Button>
    </>
  );
  const handleOutsideTabListClick = useCallback(() => {
    setOptionsOpen(false);
  }, [optionsOpen]);

  const OptionsButton = () => (
    <div onClick={(e) => {e.stopPropagation(); setOptionsOpen(prev=>!prev); }}>
      <OptionsIcon className={styles.optionsIcon} />
      <OptionsPane open={optionsOpen}>
        {options}
      </OptionsPane>
    </div>
  )

  const queriesTabHeading = useMemo(() => {
    return `${sortedData.sortedQueries.length} Quer${sortedData.sortedQueries.length === 1 ? 'y' : 'ies'}`;
  }, [sortedData.sortedQueries]);

  const handleAddNewQueryClick = () => {
    setAddNewQueryOpen(prev => !prev);
  }

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
                  <ListHeader
                    heading={localTitle}
                    searchPlaceholder="Search by Query Name"
                    searchTerm={sortSearchState.searchTerm}
                    handleSearch={sortSearchState.setSearchTerm}
                    isRenaming={isRenaming}
                    onTitleChange={handleTitleChange}
                    onFormSubmit={handleFormSubmit}
                    textInputRef={textInputRef}
                    onOutsideClick={handleOutsideClick}
                  />
                </LoadingWrapper>
              </div>
              <div className={styles.projectTabsContainer}>
                <Button 
                  iconLeft={<SearchPlusIcon />}
                  iconRight={<ChevDownIcon className={styles.iconRight} />}
                  handleClick={handleAddNewQueryClick}
                  title="Add New Query"
                  className={styles.addNewQueryButton}
                  variant="textOnly"
                >
                  Add New Query
                </Button>
                <Tabs 
                  isOpen={true}
                  handleOutsideTabListClick={handleOutsideTabListClick}
                  defaultActiveTab={queriesTabHeading}
                  className={styles.projectTabs}
                  activeTab={queriesTabHeading}
                  controlled
                >
                  <Tab key="queries" heading={queriesTabHeading} className={styles.projectTabContent}>
                    <AnimateHeight
                      duration={500}
                      height={height}
                      className={styles.combinedQueryInterfaceContainer}
                    >
                      <CombinedQueryInterface
                        projectPage
                      />
                    </AnimateHeight>
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
                      <LoadingWrapper loading={data.loading.queriesLoading}>
                        <CardList>
                          {sortedData.sortedQueries.length > 0 && (
                            <QueriesTableHeader
                              sortField={sortSearchState.sortField}
                              sortDirection={sortSearchState.sortDirection}
                              onSort={sortSearchState.handleSort}
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
                                <>
                                  {sortedData.sortedQueries.length === 0 ? (
                                      <div className={styles.emptyState}>
                                        <p>No queries found{sortSearchState.searchTerm ? ' matching your search.' : '.'}</p>
                                      </div>
                                    ) : (
                                      sortedData.sortedQueries.map((query) => (
                                        <QueryCard
                                          key={query.data.qid}
                                          query={query}
                                          searchTerm={sortSearchState.searchTerm}
                                          projectId={data.project?.id}
                                        />
                                      ))
                                    )}
                                </>
                              )
                          }
                        </CardList>
                      </LoadingWrapper>
                    </DroppableArea>
                  </Tab>
                  <Tab key="options" heading="Options" headingOverride={<OptionsButton />}>
                  </Tab>
                </Tabs>
              </div>
            </>
          )
      }
    </div>
  );
};

export default ProjectDetailInner;