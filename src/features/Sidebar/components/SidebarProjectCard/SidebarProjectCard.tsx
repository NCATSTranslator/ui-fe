import { FC, useState } from "react";
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

interface SidebarProjectCardProps {
  project: Project;
  searchTerm?: string;
}

const SidebarProjectCard: FC<SidebarProjectCardProps> = ({ project, searchTerm }) => {
  const queryCount = project.data.pks.length;
  const [isRenaming, setIsRenaming] = useState(false);
  const { openDeleteProjectModal } = useProjectModals();
  const { handleUpdateProject } = useEditProjectHandlers(undefined, [project]);
  const isUnassigned = isUnassignedProject(project);
  const className = joinClasses(styles.projectCard, isUnassigned && styles.unassigned);
  const leftIcon = <FolderIcon />;
  
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
    handleUpdateProject(project.id, value);
  }

  return (
    <OutsideClickHandler onOutsideClick={() => { if(isRenaming) setIsRenaming(false) } }>
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
    </OutsideClickHandler>
  );
};

export default SidebarProjectCard;