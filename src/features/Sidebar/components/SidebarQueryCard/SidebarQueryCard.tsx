import { FC } from "react";
import { UserQueryObject } from "@/features/Projects/types/projects";
import StatusIndicator from "@/features/Projects/components/StatusIndicator/StatusIndicator";
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';
import { getQueryLink } from "@/features/Projects/utils/utilities";
import SidebarCard from "@/features/Sidebar/components/SidebarCard/SidebarCard";
import styles from "@/features/Sidebar/components/SidebarCard/SidebarCard.module.scss";

interface SidebarQueryCardProps {
  query: UserQueryObject;
  searchTerm?: string;
  title: string;
}

const SidebarQueryCard: FC<SidebarQueryCardProps> = ({ query, searchTerm, title }) => {
  const queryURL = getQueryLink(query);
  
  const leftIcon = <StatusIndicator status={query.status} />;
  
  const bottomLeft = (
    <span className={styles.type}>
      {query.data.query.type === 'pathfinder' ? 'Pathfinder Query' : 'Smart Query'}
    </span>
  );
  
  const bottomRight = (
    <>
      <span className={styles.count}>
        <BookmarkIcon />
        {query.data.bookmark_ids.length}
      </span>
      <span className={styles.count}>
        <NoteIcon />
        {query.data.note_count}
      </span>
    </>
  );

  return (
    <SidebarCard
      leftIcon={leftIcon}
      title={title}
      searchTerm={searchTerm}
      linkTo={queryURL}
      linkTarget="_blank"
      bottomLeft={bottomLeft}
      bottomRight={bottomRight}
      data-testid="sidebar-query-card"
    />
  );
};

export default SidebarQueryCard;