import { Dispatch, SetStateAction } from 'react';
import { QueryStatusObject } from '@/features/Projects/types/projects.d';
import DataCard from '@/features/Projects/components/DataCard/DataCard';

interface QueryCardProps {
  query: QueryStatusObject;
  searchTerm?: string;
  setSelectedQueries: Dispatch<SetStateAction<QueryStatusObject[]>>;
  selectedQueries?: QueryStatusObject[];
  onEdit?: (query: QueryStatusObject) => void;
}

const QueryCard = ({ 
  query,
  searchTerm,
  setSelectedQueries,
  selectedQueries = [],
  onEdit
}: QueryCardProps) => {
  
  return (
    <DataCard
      item={query}
      type="smartQuery"
      searchTerm={searchTerm}
      selectedItems={selectedQueries}
      setSelectedItems={setSelectedQueries}
      status={query.status}
      onEdit={onEdit}
      getItemId={(item: QueryStatusObject) => item.data.qid}
      getItemTitle={(item: QueryStatusObject) => item.data.title}
      getItemTimeCreated={(item: QueryStatusObject) => item.data.time_created.toString()}
      getItemTimeUpdated={(item: QueryStatusObject) => item.data.time_updated.toString()}
      getItemBookmarkCount={(item: QueryStatusObject) => item.data.bookmark_ids.length}
      getItemNoteCount={(item: QueryStatusObject) => item.data.note_count}
      getItemStatus={(item: QueryStatusObject) => item.status}
    />
  );
};

export default QueryCard; 