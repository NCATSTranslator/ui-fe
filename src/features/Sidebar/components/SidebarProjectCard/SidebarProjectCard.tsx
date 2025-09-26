import { FC } from "react";
import { Project } from "@/features/Projects/types/projects";
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';
import FolderIcon from '@/assets/icons/projects/folder.svg?react';
import SidebarCard from "@/features/Sidebar/components/SidebarCard/SidebarCard";
import styles from "@/features/Sidebar/components/SidebarCard/SidebarCard.module.scss";

interface SidebarProjectCardProps {
  project: Project;
  searchTerm?: string;
}

const SidebarProjectCard: FC<SidebarProjectCardProps> = ({ project, searchTerm }) => {
  const queryCount = project.data.pks.length;
  
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

  return (
    <SidebarCard
      leftIcon={leftIcon}
      title={project.data.title}
      searchTerm={searchTerm}
      linkTo={`/projects/${project.id}`}
      bottomLeft={bottomLeft}
      bottomRight={bottomRight}
      data-testid="sidebar-project-card"
    />
  );
};

export default SidebarProjectCard;