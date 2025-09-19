import { FC } from "react";
import styles from "./SidebarQueryCard.module.scss";
import { UserQueryObject } from "@/features/Projects/types/projects";
import StatusIndicator from "@/features/Projects/components/StatusIndicator/StatusIndicator";
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';
import { getQueryLink } from "@/features/Projects/utils/utilities";
import { useGetQueryCardTitle } from "@/features/Projects/hooks/customHooks";

interface SidebarQueryCardProps {
  query: UserQueryObject;
}

const SidebarQueryCard: FC<SidebarQueryCardProps> = ({ query }) => {
  const queryURL = getQueryLink(query);
  const { title: queryCardTitle } = useGetQueryCardTitle(query);

  return (
    <div className={styles.sidebarQueryCard}>
      <div>
      <StatusIndicator status={query.status} />
      </div>
      <div>
        <a className={styles.title} href={`${queryURL}`} target="_blank">{queryCardTitle}</a>
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