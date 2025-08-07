import { Dispatch, SetStateAction } from 'react';
import { UserQueryObject } from '@/features/Projects/types/projects.d';
import DataCard from '@/features/Projects/components/DataCard/DataCard';

interface QueryCardProps {
  onEdit?: (query: UserQueryObject) => void;
  query: UserQueryObject;
  searchTerm?: string;
  selectedQueries?: UserQueryObject[];
  setSelectedQueries: Dispatch<SetStateAction<UserQueryObject[]>>;
}

const QueryCard = ({ 
  onEdit,
  query,
  searchTerm,
  selectedQueries = [],
  setSelectedQueries
}: QueryCardProps) => {
  
  return (
    <DataCard
      item={query}
      type={query.data.query.type === 'pathfinder' ? 'pathfinderQuery' : 'smartQuery'}
      searchTerm={searchTerm}
      selectedItems={selectedQueries}
      setSelectedItems={setSelectedQueries}
      status={query.status}
      onEdit={onEdit}
      getItemId={(item: UserQueryObject) => item.data.qid}
      getItemTitle={(item: UserQueryObject) => item.data.title || ''}
      getItemTimeCreated={(item: UserQueryObject) => item.data.time_created.toString()}
      getItemTimeUpdated={(item: UserQueryObject) => item.data.time_updated.toString()}
      getItemBookmarkCount={(item: UserQueryObject) => item.data.bookmark_ids.length}
      getItemNoteCount={(item: UserQueryObject) => item.data.note_count}
      getItemStatus={(item: UserQueryObject) => item.status}
    />
  );
};

export default QueryCard; 