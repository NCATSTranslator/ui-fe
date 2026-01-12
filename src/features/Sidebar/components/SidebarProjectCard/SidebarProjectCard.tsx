import { FC, useCallback, useMemo } from "react";
import { Project, UserQueryObject } from "@/features/Projects/types/projects";
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';
import FolderIcon from '@/assets/icons/projects/folder.svg?react';
import SidebarCard from "@/features/Sidebar/components/SidebarCard/SidebarCard";
import styles from "@/features/Sidebar/components/SidebarCard/SidebarCard.module.scss";
import Button from "@/features/Core/components/Button/Button";
import EditIcon from '@/assets/icons/buttons/Edit.svg?react';
import TrashIcon from '@/assets/icons/buttons/Trash.svg?react';
import { useProjectModals } from "@/features/Projects/hooks/useProjectModals";
import { useEditProjectHandlers } from "@/features/Projects/utils/editUpdateFunctions";
import OutsideClickHandler from "@/features/Common/components/OutsideClickHandler/OutsideClickHandler";
import { joinClasses } from "@/features/Common/utils/utilities";
import { DroppableArea } from "@/features/DragAndDrop/components/DroppableArea/DroppableArea";
import { handleQueryDrop } from "@/features/Projects/utils/dragDropUtils";
import { DraggableData } from "@/features/DragAndDrop/types/types";
import { isDraggedQueryInProject } from "@/features/Projects/utils/dragDropUtils";
import { useDndContext } from "@dnd-kit/core";
import { useRenameProject } from "@/features/Projects/hooks/useRenameProject";
import { useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";
import { queryAlreadyInProjectToast } from "@/features/Core/utils/toastMessages";
import { useGetQueryCardTitle } from "@/features/Projects/hooks/customHooks";
import { getProjectQueryCount } from "@/features/Projects/utils/utilities";

interface SidebarProjectCardProps {
  activeQueries: UserQueryObject[];
  allProjects?: Project[];
  isActiveProject?: boolean;
  onRename?: (project: Project) => void;
  project: Project;
  queriesLoading: boolean;
  searchTerm?: string;
  startRenaming?: boolean;
}

const SidebarProjectCard: FC<SidebarProjectCardProps> = ({
  activeQueries,
  allProjects,
  isActiveProject = false,
  onRename,
  project,
  queriesLoading,
  searchTerm,
  startRenaming = false,
}) => {
  const queryCount = useMemo(() => getProjectQueryCount(project, activeQueries), [project, activeQueries]);
  const { openDeleteProjectModal } = useProjectModals();
  const { handleUpdateProject } = useEditProjectHandlers();
  const { addToProjectQuery, clearAddToProjectMode, isSelectedProjectMode, setSelectedProject, setSelectedProjectMode, closePanel } = useSidebar();
  const className = joinClasses(styles.projectCard, isActiveProject && styles.activeProject);
  const leftIcon = <FolderIcon />;
  const { active } = useDndContext();
  const isQueryInProject = useMemo(() => active ? isDraggedQueryInProject(active, project) : false, [active, project]);
  const { title: queryTitle } = useGetQueryCardTitle(addToProjectQuery || null);
  const isAddToProjectMode = !!addToProjectQuery;

  const {
    isRenaming,
    localTitle,
    startRenaming: startRenamingAction,
    handleTitleChange,
    handleFormSubmit,
    handleOutsideClick,
    textInputRef
  } = useRenameProject({
    project,
    allProjects,
    startRenaming,
    onRename
  });

  const bottomLeft = (
    <>
      <span className={styles.count}>
        <BookmarkIcon />
        {project.bookmark_count}
      </span>
      <span className={styles.count}>
        <NoteIcon />
        {project.note_count}
      </span>
    </>
  );
  
  const bottomRight = (
    <span className={styles.count}>
      {queriesLoading ? "-" : queryCount} Quer{queryCount === 1 ? 'y' : 'ies'}
    </span>
  );

  const options = (
    <>
      <Button handleClick={startRenamingAction} iconLeft={<EditIcon />}>Rename</Button>
      <Button handleClick={() => openDeleteProjectModal(project)} iconLeft={<TrashIcon />}>Delete</Button>
    </>
  );

  const onQueryDrop = useCallback((draggedItem: DraggableData) => {
    if(project)
      handleQueryDrop(draggedItem, project, project.data.pks, handleUpdateProject);
    else
      console.error('No project found');
  }, [project, handleUpdateProject]);

  const handleAddQueryToProject = useCallback(() => {
    if (!addToProjectQuery || !project) return;

    // Check if query is already in project
    const isQueryAlreadyInProject = project.data.pks.includes(addToProjectQuery.data.qid);
    if (isQueryAlreadyInProject) {
      queryAlreadyInProjectToast(queryTitle, project.data.title);
      return;
    }

    // Add query to project, clear add to project mode on success
    handleUpdateProject(project.id, undefined, [...project.data.pks, addToProjectQuery.data.qid], clearAddToProjectMode);
  }, [addToProjectQuery, project, handleUpdateProject, clearAddToProjectMode, queryTitle]);

  const handleProjectClick = useMemo(() => {
    if(isAddToProjectMode) {
      return () => {
        handleAddQueryToProject();
      }
    }
    if(isSelectedProjectMode) {
      return () => {
        setSelectedProject(project);
        setSelectedProjectMode(false);
        closePanel();
      }
    }

    return undefined;
  }, [isAddToProjectMode, isSelectedProjectMode, project, setSelectedProject, setSelectedProjectMode, handleAddQueryToProject]);

  return (
    <OutsideClickHandler onOutsideClick={handleOutsideClick}>
      <DroppableArea 
        id={`project-zone-${project.id}`}
        canAccept={(draggedData) => draggedData.type === 'query'}
        data={{ 
          id: project.id?.toString(),
          type: 'project',
          onDrop: onQueryDrop
        }}
        indicatorText={`${isQueryInProject ? 'Already in Project' : 'Add to Project'}`}
        indicatorStatus={isQueryInProject ? 'error' : 'default'}
        indicatorClass={styles.sidebarDropIndicator}
        indicateOnlyOnOver
      >
        <SidebarCard
          leftIcon={leftIcon}
          title={localTitle}
          searchTerm={searchTerm}
          linkTo={`/projects/${project.id}`}
          onClick={handleProjectClick}
          bottomLeft={bottomLeft}
          bottomRight={bottomRight}
          data-testid="sidebar-project-card"
          className={className}
          options={isAddToProjectMode ? undefined : options}
          isRenaming={isRenaming}
          onTitleChange={handleTitleChange}
          onFormSubmit={handleFormSubmit}
          textInputRef={textInputRef}
        />
      </DroppableArea>
    </OutsideClickHandler>
  );
};

export default SidebarProjectCard;