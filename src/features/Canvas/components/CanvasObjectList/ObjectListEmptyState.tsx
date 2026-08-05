import { FC } from 'react';
import styles from './CanvasObjectList.module.scss';

interface ObjectListEmptyStateProps {
  entityLabel: string;
  allCount: number;
  filteredCount: number;
  searchTerm?: string;
  onAdd?: () => void;
  addLabel?: string;
}

const ObjectListEmptyState: FC<ObjectListEmptyStateProps> = ({
  entityLabel,
  allCount,
  filteredCount,
  searchTerm,
  onAdd,
  addLabel,
}) => {
  if (allCount === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No {entityLabel} on this canvas yet.</p>
        {onAdd && addLabel && (
          <button type="button" className={styles.emptyAction} onClick={onAdd}>
            {addLabel}
          </button>
        )}
      </div>
    );
  }

  if (filteredCount === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No matching {entityLabel}.</p>
        {onAdd && addLabel && (
          <button type="button" className={styles.emptyAction} onClick={onAdd}>
            {searchTerm ? `Add "${searchTerm}"` : addLabel}
          </button>
        )}
      </div>
    );
  }

  return null;
};

export default ObjectListEmptyState;
