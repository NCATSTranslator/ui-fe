import { FC } from "react";
import styles from "./SidebarQueryCard.module.scss";
import { Link } from "react-router-dom";
import { UserQueryObject } from "@/features/Projects/types/projects";
import StatusIndicator from "@/features/Projects/components/StatusIndicator/StatusIndicator";
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';
import { getQueryLink } from "@/features/Projects/utils/utilities";
import { useGetQueryCardTitle } from "@/features/Projects/hooks/customHooks";
import Highlighter from "react-highlight-words";

interface SidebarQueryCardProps {
  query: UserQueryObject;
  searchTerm?: string;
  title?: string;
}

const SidebarQueryCard: FC<SidebarQueryCardProps> = ({ query, searchTerm, title }) => {
  const queryURL = getQueryLink(query);
  const { title: queryCardTitle } = useGetQueryCardTitle(query);

  return (
    <div className={styles.sidebarQueryCard}>
      <div>
      <StatusIndicator status={query.status} className={styles.status} />
      </div>
      <div>
        <Link className={styles.title} to={`${queryURL}`} target="_blank">
          <Highlighter
            highlightClassName="highlight"
            searchWords={searchTerm ? [searchTerm] : []}
            autoEscape={true}
            textToHighlight={title || queryCardTitle}
          />
        </Link>
        <div className={styles.bottom}>
          <span className={styles.type}>{query.data.query.type === 'pathfinder' ? 'Pathfinder Query' : 'Smart Query'}</span>
          <div className={styles.saves}>
            <span className={styles.count}><BookmarkIcon />{query.data.bookmark_ids.length}</span>
            <span className={styles.count}><NoteIcon />{query.data.note_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarQueryCard;