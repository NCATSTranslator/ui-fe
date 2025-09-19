import { FC } from "react";
import styles from "./SidebarProjectCard.module.scss";
import { Project } from "@/features/Projects/types/projects";
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';
import FolderIcon from '@/assets/icons/projects/folder.svg?react';
import { Link } from "react-router-dom";
import Highlighter from "react-highlight-words";

interface SidebarProjectCardProps {
  project: Project;
  searchTerm?: string;
}

const SidebarProjectCard: FC<SidebarProjectCardProps> = ({ project, searchTerm }) => {
  const queryCount = project.data.pks.length;
  return (
    <div className={styles.sidebarProjectCard}>
      <div>
        <FolderIcon className={styles.folderIcon}/>
      </div>
      <div>
        <Link className={styles.title} to={`/projects/${project.id}`}>
          <Highlighter
            highlightClassName="highlight"
            searchWords={searchTerm ? [searchTerm] : []}
            autoEscape={true}
            textToHighlight={project.data.title}
          />
        </Link>
        <div className={styles.bottom}>
          <div className={styles.saves}>
            <span className={styles.count}><BookmarkIcon />{project.bookmark_count}</span>
            <span className={styles.count}><NoteIcon />{project.note_count}</span>
          </div>
          <div className={styles.queryCount}>
            <span className={styles.count}>{queryCount} Quer{queryCount === 1 ? 'y' : 'ies'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarProjectCard;