import { FC, useCallback, useMemo, useState } from "react";
import { Project } from "@/features/Projects/types/projects";
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';
import FolderIcon from '@/assets/icons/projects/folder.svg?react';
import SidebarCard from "@/features/Sidebar/components/SidebarCard/SidebarCard";
import styles from "@/features/Sidebar/components/SidebarCard/SidebarCard.module.scss";
import Button from "@/features/Core/components/Button/Button";
import EditIcon from '@/assets/icons/buttons/Edit.svg?react';
import TrashIcon from '@/assets/icons/buttons/Trash.svg?react';
import { useProjectModals } from "@/features/Projects/hooks/useProjectModals";
import { isUnassignedProject, useEditProjectHandlers } from "@/features/Projects/utils/editUpdateFunctions";
import OutsideClickHandler from "@/features/Common/components/OutsideClickHandler/OutsideClickHandler";
import { joinClasses } from "@/features/Common/utils/utilities";
import { DroppableArea } from "@/features/DragAndDrop/components/DroppableArea/DroppableArea";
import { handleQueryDrop } from "@/features/Projects/utils/dragDropUtils";
import { DraggableData } from "@/features/DragAndDrop/types/types";
import { isDraggedQueryInProject } from "@/features/Projects/utils/dragDropUtils";
import { useDndContext } from "@dnd-kit/core";

interface ProjectCardProps {
  blankProjectTitle: string;
  onRename?: (project: Project) => void;
  project: Project;
  searchTerm?: string;
  startRenaming?: boolean;
}

const ProjectCard: FC<ProjectCardProps> = ({
  project,
  searchTerm,
  startRenaming = false,
  onRename,
  blankProjectTitle
}) => {
  const queryCount = project.data.pks.length;
  const [isRenaming, setIsRenaming] = useState(startRenaming);
  const { openDeleteProjectModal } = useProjectModals();
  const { handleUpdateProject } = useEditProjectHandlers();
  const isUnassigned = isUnassignedProject(project);
  const className = joinClasses(styles.projectCard, isUnassigned && styles.unassigned);
  const leftIcon = <FolderIcon />;
  const { active } = useDndContext();
  const isQueryInProject = useMemo(() => active ? isDraggedQueryInProject(active, project) : false, [active, project]);

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
      {queryCount} Quer{queryCount === 1 ? 'y' : 'ies'}
    </span>
  );

  const options = (
    <>
      <Button handleClick={()=> setIsRenaming(true)} iconLeft={<EditIcon />}>Rename</Button>
      <Button handleClick={() => openDeleteProjectModal(project)} iconLeft={<TrashIcon />}>Delete</Button>
    </>
  );

  const handleRename = (value: string) => {
    const newTitle = (value.length > 0) ? value.trim() : blankProjectTitle;
    handleUpdateProject(project.id, newTitle);
    onRename?.(project);
  }

  const handleOutsideClick = () => {
    if(isRenaming) {
      // if the project title is empty, call handleRename with an empty string to set the default title
      if(project.data.title.length === 0)
        handleRename('');
      setIsRenaming(false);
    }
  };

  const onQueryDrop = useCallback((draggedItem: DraggableData) => {
    if(project)
      handleQueryDrop(draggedItem, project, project.data.pks, handleUpdateProject);
    else
      console.error('No project found');
  }, [project, handleUpdateProject]);

  return (
    <OutsideClickHandler onOutsideClick={handleOutsideClick}>
      <DroppableArea 
        id={`project-zone-${project.id}`}
        canAccept={(draggedData) => draggedData.type === 'query'}
        disabled={isUnassignedProject(project || -1)}
        data={{ 
          id: project.id?.toString(),
          type: 'project',
          onDrop: onQueryDrop
        }}
        indicatorText={`${isQueryInProject ? 'Query Already in Project' : 'Add to Project'}`}
        indicatorStatus={isQueryInProject ? 'error' : 'default'}
        indicatorClass={styles.sidebarDropIndicator}
      >
        <SidebarCard
          leftIcon={leftIcon}
          title={project.data.title}
          searchTerm={searchTerm}
          linkTo={`/projects/${project.id}`}
          bottomLeft={bottomLeft}
          bottomRight={bottomRight}
          data-testid="sidebar-project-card"
          className={className}
          options={isUnassigned ? undefined : options}
          isRenaming={isRenaming}
          setIsRenaming={setIsRenaming}
          onRename={handleRename}
        />
      </DroppableArea>
    </OutsideClickHandler>
  );
};

export default ProjectCard;