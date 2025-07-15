import { QueryStatusObject } from '@/features/Projects/types/projects.d';
import Checkbox from '@/features/Core/components/Checkbox/Checkbox';
import styles from '@/features/Projects/components/TableHeader/TableHeader.module.scss';
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';

interface QueriesTableHeaderProps {
  selectedQueries: QueryStatusObject[];
  setSelectedQueries: (queries: QueryStatusObject[]) => void;
  activeQueries: QueryStatusObject[];
}

const QueriesTableHeader = ({
  selectedQueries,
  setSelectedQueries,
  activeQueries
}: QueriesTableHeaderProps) => {
  const handleSelectAll = () => {
    if (selectedQueries.length === activeQueries.length) {
      setSelectedQueries([]);
    } else {
      setSelectedQueries([...activeQueries]);
    }
  };

  const allSelected = activeQueries.length > 0 && selectedQueries.length === activeQueries.length;
  const someSelected = selectedQueries.length > 0 && selectedQueries.length < activeQueries.length;

  return (
    <div className={styles.tableHeader}>
      <div className={styles.tableRow}>
        <div className={styles.checkboxColumn}>
          <Checkbox 
            checked={allSelected}
            handleClick={handleSelectAll}
            className={someSelected ? styles.indeterminate : ''}
          />
          <div className={styles.separator}></div>
        </div>
        <div className={styles.nameColumn}>Name</div>
        <div className={styles.actionsColumn}></div>
        <div className={styles.lastSeenColumn}>Last Seen</div>
        <div className={styles.dateAddedColumn}>Date Added</div>
        <div className={styles.bookmarksColumn}><BookmarkIcon /></div>
        <div className={styles.notesColumn}><NoteIcon /></div>
        <div className={styles.statusColumn}>Status</div>
      </div>
    </div>
  );
};

export default QueriesTableHeader; 