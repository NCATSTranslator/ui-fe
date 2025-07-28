import { Dispatch, SetStateAction } from 'react';
import styles from './QueryCard.module.scss';
import { getFormattedDate } from '@/features/Common/utils/utilities';
import { QueryStatusObject } from '@/features/Projects/types/projects.d';
import Button from '@/features/Core/components/Button/Button';
import ShareIcon from '@/assets/icons/buttons/Share.svg?react';
import EditIcon from '@/assets/icons/buttons/Edit.svg?react';
import CardWrapper from '@/features/Projects/components/CardWrapper/CardWrapper';
import StatusIndicator from '@/features/Projects/components/StatusIndicator/StatusIndicator';
import Checkbox from '@/features/Core/components/Checkbox/Checkbox';
import CardName from '../CardName/CardName';

interface QueryCardProps {
  query: QueryStatusObject;
  searchTerm?: string;
  setSelectedQueries: Dispatch<SetStateAction<QueryStatusObject[]>>;
  selectedQueries?: QueryStatusObject[];
}

const QueryCard = ({ 
  query,
  searchTerm,
  setSelectedQueries,
  selectedQueries = []
}: QueryCardProps) => {
  
  const { title, time_created, time_updated, bookmark_count, note_count } = query.data;

  const handleSelectQuery = () => {
    setSelectedQueries((prevQueries) => {
      if (prevQueries.includes(query)) {
        return prevQueries.filter((q) => q.data.qid !== query.data.qid);
      }
      return [...prevQueries, query];
    });
  };

  return (
    <CardWrapper className={styles.queryCard}>
      <div className={styles.checkboxColumn}>
        <Checkbox checked={selectedQueries.includes(query)} handleClick={handleSelectQuery} />
      </div>
      <div className={styles.nameColumn}>
        <CardName 
          type="smartQuery"
          name={title}
          // TODO: ask Gus to add result count to data object
          //itemCount={query.data.result_count}
          searchTerm={searchTerm}
        />
      </div>
      <div className={styles.actionsColumn}>
        <Button variant="secondary" iconOnly>
          <EditIcon/>
        </Button>
        <Button variant="secondary" iconOnly>
          <ShareIcon/>
        </Button>
      </div>
      <div className={styles.lastSeenColumn}>
        {getFormattedDate(new Date(time_updated), false)}
      </div>
      <div className={styles.dateCreatedColumn}>
        {getFormattedDate(new Date(time_created), false)}
      </div>
      <div className={styles.bookmarksColumn}>
        {bookmark_count}
      </div>
      <div className={styles.notesColumn}>
        {note_count}
      </div>
      <div className={styles.statusColumn}>
        <StatusIndicator status={query.status} />
      </div>
    </CardWrapper>
  )
}

export default QueryCard; 