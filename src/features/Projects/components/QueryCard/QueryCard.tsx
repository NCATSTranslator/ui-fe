import { Dispatch, SetStateAction } from 'react';
import { DataCardLocation, UserQueryObject } from '@/features/Projects/types/projects.d';
import DataCard from '@/features/Projects/components/DataCard/DataCard';
import { useEditQueryHandlers } from '@/features/Projects/utils/editUpdateFunctions';

interface QueryCardProps {
  inUnassignedProject?: boolean;
  isEditing?: boolean;
  location?: DataCardLocation;
  onDelete?: (query: UserQueryObject) => void;
  onEdit?: (query: UserQueryObject) => void;
  query: UserQueryObject;
  queries: UserQueryObject[];
  searchTerm?: string;
  selectedQueries?: UserQueryObject[];
  setSelectedQueries: Dispatch<SetStateAction<UserQueryObject[]>>;
  onShare?: (query: UserQueryObject) => void;
}

const QueryCard = ({ 
  inUnassignedProject = false,
  isEditing = false,
  location = "list",
  onDelete,
  onEdit,
  query,
  queries,
  searchTerm,
  selectedQueries = [],
  setSelectedQueries,
  onShare
}: QueryCardProps) => {

  const editQueryHandlers = useEditQueryHandlers(undefined, queries);

  const onRestore = (query: UserQueryObject) => {
    editQueryHandlers.handleRestoreQuery(query);
  };

  const handleShare = (query: UserQueryObject) => {
    onShare?.(query);
  }
  
  return (
    <DataCard
      location={location}
      inUnassignedProject={inUnassignedProject}
      isEditing={isEditing}
      item={query}
      type={query.data.query.type === 'pathfinder' ? 'pathfinderQuery' : 'smartQuery'}
      searchTerm={searchTerm}
      selectedItems={selectedQueries}
      setSelectedItems={setSelectedQueries}
      status={query.status}
      onDelete={onDelete}
      onEdit={onEdit}
      onRestore={onRestore}
      getItemId={(item: UserQueryObject) => item.data.qid}
      getItemTitle={(item: UserQueryObject) => item.data.title || ''}
      getItemTimeCreated={(item: UserQueryObject) => item.data.time_created.toString()}
      getItemTimeUpdated={(item: UserQueryObject) => item.data.time_updated.toString()}
      getItemBookmarkCount={(item: UserQueryObject) => item.data.bookmark_ids.length}
      getItemNoteCount={(item: UserQueryObject) => item.data.note_count}
      getItemStatus={(item: UserQueryObject) => item.status}
      onShare={handleShare}
    />
  );
};

export default QueryCard; 