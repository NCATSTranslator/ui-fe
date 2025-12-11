import { FC, useMemo } from "react";
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
import { useProjectModals } from "@/features/Projects/hooks/useProjectModals";
import Button from "@/features/Core/components/Button/Button";
import FolderPlusIcon from '@/assets/icons/projects/folderplus.svg?react';
import ShareIcon from '@/assets/icons/buttons/Share.svg?react';
import TrashIcon from '@/assets/icons/buttons/Trash.svg?react';
import { getTimeRelativeDate } from "@/features/Common/utils/utilities";
import { useLocation } from "react-router-dom";
import { useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";

interface SidebarQueryCardProps {
  query: UserQueryObject;
  searchTerm?: string;
}

const SidebarQueryCard: FC<SidebarQueryCardProps> = ({
  query,
  searchTerm
}) => {
  const { title } = useGetQueryCardTitle(query);  
  const { openDeleteQueriesModal, openShareQueryModal } = useProjectModals();
  const { activePanelId, setAddToProjectMode, togglePanel } = useSidebar();

  const currentPage = useLocation().pathname.replace('/', '');
  const disableDragging = useMemo(() => {
    return query.data.deleted || !currentPage.includes('projects');
  }, [query.data.deleted, currentPage]);

  const queryURL = getQueryLink(query);
  const queryTime = getTimeRelativeDate(new Date(query.data.time_updated));
  
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
        {queryTime}
      </span>
  );

  const handleAddToProject = () => {
    setAddToProjectMode(query);
    if (activePanelId !== 'queries') {
      togglePanel('queries');
    }
  };

  const options = (
    <>
      <Button handleClick={handleAddToProject} iconLeft={<FolderPlusIcon className={styles.folderPlusIcon} />} className={styles.addToProjectButton}>Add to Project</Button>
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
      <SidebarCard
        leftIcon={leftIcon}
        title={title}
        searchTerm={searchTerm}
        linkTo={queryURL}
        bottomLeft={bottomLeft}
        bottomRight={bottomRight}
        data-testid="sidebar-query-card"
        options={options}
      />
    </DraggableCard>
  );
};

export default SidebarQueryCard;