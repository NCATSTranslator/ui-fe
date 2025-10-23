import { FC, useMemo } from "react";
import { UserQueryObject } from "@/features/Projects/types/projects";
import StatusIndicator from "@/features/Projects/components/StatusIndicator/StatusIndicator";
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';
import { getQueryLink } from "@/features/Projects/utils/utilities";
import DataCard from "@/features/Projects/components/DataCard/DataCard";
import styles from "@/features/Sidebar/components/SidebarCard/SidebarCard.module.scss";
import { useGetQueryCardTitle } from "@/features/Projects/hooks/customHooks";
import { DraggableCard } from "@/features/DragAndDrop/components/DraggableCard/DraggableCard";
import { DraggableData } from "@/features/DragAndDrop/types/types";
import { useProjectModals } from "@/features/Projects/hooks/useProjectModals";
import Button from "@/features/Core/components/Button/Button";
import FolderPlusIcon from '@/assets/icons/projects/folderplus.svg?react';
import ShareIcon from '@/assets/icons/buttons/Share.svg?react';
import TrashIcon from '@/assets/icons/buttons/Trash.svg?react';
import { getTimeRelativeDate } from "@/features/Common/utils/utilities";
import { useLocation } from "react-router-dom";

interface QueryCardProps {
  query: UserQueryObject;
  searchTerm?: string;
}

const QueryCard: FC<QueryCardProps> = ({ query, searchTerm }) => {
  const { title } = useGetQueryCardTitle(query);  
  const { openDeleteQueriesModal, openShareQueryModal } = useProjectModals();

  const currentPage = useLocation().pathname.replace('/', '');
  const disableDragging = useMemo(() => {
    return query.data.deleted || !currentPage.includes('projects');
  }, [query.data.deleted, currentPage]);

  const queryURL = getQueryLink(query);
  const queryTime = getTimeRelativeDate(new Date(query.data.time_updated));
  
  const icon = <StatusIndicator status={query.status} />;
  
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
        {queryTime}
      </span>
  );

  const options = (
    <>
      <Button handleClick={()=>{}} iconLeft={<FolderPlusIcon className={styles.folderPlusIcon} />}>Add to Project</Button>
      <Button handleClick={() => openShareQueryModal(query)} iconLeft={<ShareIcon />}>Share Query</Button>
      <Button handleClick={() => openDeleteQueriesModal([query])} iconLeft={<TrashIcon />}>Delete Query</Button>
    </>
  );

  const draggableData: DraggableData = {
    type: 'query',
    data: query,
  };
  return (
    <DraggableCard id={query.data.qid} data={draggableData} disableDraggingOnly={disableDragging}>
      <DataCard
        icon={icon}
        title={title}
        searchTerm={searchTerm}
        linkTo={queryURL}
        linkTarget="_blank"
        options={options}
        type="query"
        bookmarksCount={query.data.bookmark_ids.length}
        notesCount={query.data.note_count}
        date={getTimeRelativeDate(new Date(query.data.time_updated))}
        queryType={query.data.query.type}
      />
    </DraggableCard>
  );
};

export default QueryCard;