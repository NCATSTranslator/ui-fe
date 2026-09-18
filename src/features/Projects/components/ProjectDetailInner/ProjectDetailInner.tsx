import { FC, MouseEvent, Dispatch, SetStateAction } from 'react';
import styles from './ProjectDetailInner.module.scss';
import LoadingWrapper from '@/features/Core/components/LoadingWrapper/LoadingWrapper';
import Tabs from '@/features/Core/components/Tabs/Tabs';
import Tab from '@/features/Core/components/Tabs/Tab';
import ProjectDetailErrorStates from '@/features/Projects/components/ProjectDetailErrorStates/ProjectDetailErrorStates';
import OptionsIcon from '@/assets/icons/buttons/Dot Menu/Vertical Dot Menu.svg?react';
import EditIcon from '@/assets/icons/buttons/Edit.svg?react';
import TrashIcon from '@/assets/icons/buttons/Trash.svg?react';
import OptionsPane from '@/features/Sidebar/components/OptionsPane/OptionsPane';
import Button from '@/features/Core/components/Button/Button';
import ListHeader from '@/features/Core/components/ListHeader/ListHeader';
import CirclePlusIcon from '@/assets/icons/queries/CirclePlus.svg?react';
import ChevDownIcon from '@/assets/icons/directional/Chevron/Chevron Down.svg?react';
import AnimateHeight from 'react-animate-height';
import CombinedQueryInterface from '@/features/Query/components/CombinedQueryInterface/CombinedQueryInterface';
import ProjectDetailQueriesPanel from '@/features/Projects/components/ProjectDetailInner/ProjectDetailQueriesPanel';
import { useProjectDetailViewModel } from '@/features/Projects/hooks/useProjectDetailViewModel';
import type { Project } from '@/features/Projects/types/projects';

interface ProjectDetailOptionsButtonProps {
  optionsOpen: boolean;
  setOptionsOpen: Dispatch<SetStateAction<boolean>>;
  onRename: (e: MouseEvent<HTMLElement>) => void;
  project?: Project;
  onDelete: (project: Project) => void;
}

const ProjectDetailOptionsButton: FC<ProjectDetailOptionsButtonProps> = ({
  optionsOpen,
  setOptionsOpen,
  onRename,
  project,
  onDelete,
}) => (
  <div onClick={(e) => { e.stopPropagation(); setOptionsOpen(prev => !prev); }}>
    <OptionsIcon className={styles.optionsIcon} />
    <OptionsPane open={optionsOpen}>
      <Button handleClick={onRename} iconLeft={<EditIcon />}>Rename</Button>
      <Button
        handleClick={() => { if (project) onDelete(project); }}
        iconLeft={<TrashIcon />}
      >
        Delete
      </Button>
    </OptionsPane>
  </div>
);

const ProjectDetailInner = () => {
  const vm = useProjectDetailViewModel();

  if (vm.shouldShowProjectErrorState) {
    return (
      <div className={styles.projectDetail}>
        <ProjectDetailErrorStates type="projects" styles={styles} />
      </div>
    );
  }

  return (
    <div className={styles.projectDetail}>
      <div className={styles.projectHeaderContainer}>
        <LoadingWrapper loading={vm.projectsLoading}>
          <ListHeader
            heading={vm.rename.localTitle}
            searchPlaceholder="Search Queries"
            searchTerm={vm.sortSearchState.searchTerm}
            handleSearch={vm.sortSearchState.handleSearch}
            isRenaming={vm.rename.isRenaming}
            onTitleChange={vm.rename.handleTitleChange}
            onFormSubmit={vm.rename.handleFormSubmit}
            textInputRef={vm.rename.textInputRef}
            onOutsideClick={vm.rename.handleOutsideClick}
            onTitleClick={vm.handleRenameClick}
          />
        </LoadingWrapper>
      </div>
      <div className={styles.projectTabsContainer}>
        <Button
          iconLeft={<CirclePlusIcon />}
          iconRight={<ChevDownIcon className={styles.iconRight} />}
          handleClick={vm.handleAddNewQueryClick}
          title="Add New Query"
          className={styles.addNewQueryButton}
          variant="textOnly"
        >
          Add New Query
        </Button>
        <Tabs
          handleOutsideTabListClick={vm.handleOutsideTabListClick}
          defaultActiveTab={vm.queriesTabHeading}
          className={styles.projectTabs}
          tabListWrapperClassName={styles.projectTabsTabListWrapper}
          activeTab={vm.queriesTabHeading}
          controlled
        >
          <Tab key="queries" heading={vm.queriesTabHeading} className={styles.projectTabContent}>
            <AnimateHeight
              duration={500}
              height={vm.height}
              className={styles.combinedQueryInterfaceContainer}
            >
              <CombinedQueryInterface
                projectPage
                defaultProject={vm.data.project}
                submissionCallback={vm.handleRefetch}
              />
            </AnimateHeight>
            <ProjectDetailQueriesPanel
              isDraggedQueryInProject={vm.isDraggedQueryInProject}
              onQueryDrop={vm.onQueryDrop}
              projectId={vm.data.project?.id}
              queriesLoading={vm.queriesLoading}
              searchTerm={vm.sortSearchState.searchTerm}
              shouldShowQueriesErrorState={vm.shouldShowQueriesErrorState}
              showDropLabel={vm.showDropLabel}
              sortDirection={vm.sortSearchState.sortDirection}
              sortField={vm.sortSearchState.sortField}
              sortedQueries={vm.sortedData.sortedQueries}
              onSort={vm.sortSearchState.handleSort}
              onToggleQueriesPanel={() => vm.togglePanel('queries')}
              onAddNewQuery={vm.handleAddNewQueryClick}
            />
          </Tab>
          <Tab
            key="options"
            heading="Options"
            headingOverride={(
              <ProjectDetailOptionsButton
                optionsOpen={vm.optionsOpen}
                setOptionsOpen={vm.setOptionsOpen}
                onRename={vm.handleRenameClick}
                project={vm.data.project}
                onDelete={vm.openDeleteProjectModal}
              />
            )}
          />
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectDetailInner;
