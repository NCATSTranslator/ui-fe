import { FC, useMemo } from "react";
import { UserQueryObject } from "@/features/Projects/types/projects";
import StatusIndicator from "@/features/Projects/components/StatusIndicator/StatusIndicator";
import { getQueryLink } from "@/features/Projects/utils/utilities";
import DataCard from "@/features/Projects/components/DataCard/DataCard";
import styles from "@/features/Projects/components/DataCard/DataCard.module.scss";
import { useGetQueryCardTitle, useUserProjects } from "@/features/Projects/hooks/customHooks";
import { DraggableCard } from "@/features/DragAndDrop/components/DraggableCard/DraggableCard";
import { DraggableData } from "@/features/DragAndDrop/types/types";
import { useProjectModals } from "@/features/Projects/hooks/useProjectModals";
import Button from "@/features/Core/components/Button/Button";
import FolderPlusIcon from '@/assets/icons/projects/folderplus.svg?react';
import FolderEmptyIcon from '@/assets/icons/projects/folderempty.svg?react';
import ShareIcon from '@/assets/icons/buttons/Share.svg?react';
import TrashIcon from '@/assets/icons/buttons/Trash.svg?react';
import { getTimeRelativeDate } from "@/features/Common/utils/utilities";
import { useLocation } from "react-router-dom";
import { useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";
import { useEditProjectHandlers } from "@/features/Projects/utils/editUpdateFunctions";
import { projectUpdatedToast } from "@/features/Core/utils/toastMessages";

interface QueryCardProps {
  projectId?: number;
  query: UserQueryObject;
  searchTerm?: string;
}

const QueryCard: FC<QueryCardProps> = ({
  projectId,
  query,
  searchTerm
}) => {
  const { title } = useGetQueryCardTitle(query);  
  const { openDeleteQueriesModal, openShareQueryModal } = useProjectModals();
  const { activePanelId, setAddToProjectMode, togglePanel } = useSidebar();
  const { handleUpdateProject } = useEditProjectHandlers();
  const { data: projects = [] } = useUserProjects();

  const currentPage = useLocation().pathname.replace('/', '');
  const disableDragging = useMemo(() => {
    return activePanelId !== 'projects' && (query.data.deleted || !currentPage.includes('projects'));
  }, [query.data.deleted, currentPage, activePanelId]);

  const queryURL = getQueryLink(query);
  const queryTime = getTimeRelativeDate(new Date(query.data.time_updated));
  
  const icon = <StatusIndicator status={query.status} />;

  const handleAddToProject = () => {
    setAddToProjectMode(query);
    if (activePanelId !== 'projects') {
      togglePanel('projects');
    }
  };
  const handleShareQuery = () => {
    openShareQueryModal(query);
  };
  const handleDeleteQuery = () => {
    openDeleteQueriesModal([query]);
  };

  const handleRemoveFromProject = () => {
    if(!projectId) return;
    const project = projects.find(p => p.id === projectId);
    if(!project) return;
    // need to trigger the toast here, because the query gets removed from the project before the onSuccess callback is triggered, which normally handles the toast
    projectUpdatedToast(project.data.title, title, 'remove');
    // remove the query from the project
    handleUpdateProject(projectId, undefined, project.data.pks.filter(qid => qid !== query.data.qid));
  };

  const options = (
    <>
      <Button handleClick={handleAddToProject} iconLeft={<FolderPlusIcon className={styles.folderPlusIcon} />} className={styles.addToProjectButton}>Add to Project</Button>
      {
        projectId && (
          <Button handleClick={handleRemoveFromProject} iconLeft={<FolderEmptyIcon className={styles.folderPlusIcon} />} className={styles.removeFromProjectButton}>Remove from this Project</Button>
        )
      }
      <Button handleClick={handleShareQuery} iconLeft={<ShareIcon />}>Share Link</Button>
      <Button handleClick={handleDeleteQuery} iconLeft={<TrashIcon />}>Delete Query</Button>
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
        options={options}
        type="query"
        bookmarksCount={query.data.bookmark_ids.length}
        notesCount={query.data.note_count}
        date={queryTime}
        queryType={query.data.query.type}
      />
    </DraggableCard>
  );
};

export default QueryCard;