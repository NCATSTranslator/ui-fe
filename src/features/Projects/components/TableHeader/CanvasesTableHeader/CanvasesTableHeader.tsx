import { SortSearchState } from '@/features/Projects/types/projects.d';
import styles from '@/features/Projects/components/TableHeader/TableHeader.module.scss';
import SortableHeader from '@/features/Projects/components/SortableHeader/SortableHeader';

interface CanvasesTableHeaderProps {
  sortSearchState: SortSearchState;
}

const CanvasesTableHeader = ({
  sortSearchState
}: CanvasesTableHeaderProps) => {
  const {
    sortField,
    sortDirection,
    handleSort
  } = sortSearchState;

  return (
    <div className={styles.tableHeader}>
      <div className={`${styles.tableRow} ${styles.canvasCardRow}`}>
        <div className={styles.nameColumn}>
          <SortableHeader
            field="name"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          >
            Name
          </SortableHeader>
        </div>
        <div className={styles.queriesColumn}>
          <SortableHeader
            field="objects"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          >
            Objects
          </SortableHeader>
        </div>
        <div className={styles.queriesColumn}>
          <SortableHeader
            field="relationships"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          >
            Relationships
          </SortableHeader>
        </div>
        <div className={styles.createdColumn}>
          <SortableHeader
            field="created"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          >
            Created
          </SortableHeader>
        </div>
        <div className={styles.lastSeenColumn}>
          <SortableHeader
            field="lastSeen"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          >
            Last Changed
          </SortableHeader>
        </div>
        <div className={styles.optionsColumn}></div>
      </div>
    </div>
  );
};

export default CanvasesTableHeader;
