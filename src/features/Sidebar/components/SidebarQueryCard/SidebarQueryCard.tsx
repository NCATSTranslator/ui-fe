import { FC } from "react";
import { UserQueryObject } from "@/features/Projects/types/projects";
import StatusIndicator from "@/features/Projects/components/StatusIndicator/StatusIndicator";
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';
import { getQueryLink } from "@/features/Projects/utils/utilities";
import SidebarCard from "@/features/Sidebar/components/SidebarCard/SidebarCard";
import styles from "@/features/Sidebar/components/SidebarCard/SidebarCard.module.scss";
import { useGetQueryCardTitle } from "@/features/Projects/hooks/customHooks";
import { DraggableCard } from "@/features/DragAndDrop/components/DraggableCard/DraggableCard";
import { DraggableData } from "@/features/DragAndDrop/types/types";

interface SidebarQueryCardProps {
  query: UserQueryObject;
  searchTerm?: string;
}

const SidebarQueryCard: FC<SidebarQueryCardProps> = ({ query, searchTerm }) => {
  const { title } = useGetQueryCardTitle(query);  

  const queryURL = getQueryLink(query);
  
  const leftIcon = <StatusIndicator status={query.status} />;
  
  const bottomLeft = (
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
  
  const bottomRight = (
      <span className={`${styles.date} ${styles.count}`}>
        {/* TODO: Add date */}
        Date
      </span>
  );

  const draggableData: DraggableData = {
    type: 'query',
    data: query,
  };

  return (
    <DraggableCard id={query.data.qid} data={draggableData}>
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
    </DraggableCard>
  );
};

export default SidebarQueryCard;