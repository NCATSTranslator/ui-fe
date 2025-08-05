import { Dispatch, SetStateAction, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DataCard.module.scss';
import { getFormattedDate } from '@/features/Common/utils/utilities';
import Button from '@/features/Core/components/Button/Button';
import ShareIcon from '@/assets/icons/buttons/Share.svg?react';
import EditIcon from '@/assets/icons/buttons/Edit.svg?react';
import CardWrapper from '@/features/Projects/components/CardWrapper/CardWrapper';
import StatusIndicator from '@/features/Projects/components/StatusIndicator/StatusIndicator';
import Checkbox from '@/features/Core/components/Checkbox/Checkbox';
import CardName from '@/features/Projects/components/CardName/CardName';
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';
import { Project, QueryStatus, QueryStatusObject } from '@/features/Projects/types/projects';

interface DataCardProps<T> {
  className?: string;
  getItemId: (item: T) => number | string;
  getItemTitle: (item: T) => string;
  getItemTimeCreated: (item: T) => string;
  getItemTimeUpdated: (item: T) => string;
  getItemBookmarkCount: (item: T) => number;
  getItemNoteCount: (item: T) => number;
  getItemStatus?: (item: T) => string;
  getItemCount?: (item: T) => number;
  item: T;
  onEdit?: (item: T) => void;
  onShare?: (item: T) => void;
  searchTerm?: string;
  selectedItems: T[];
  setSelectedItems: Dispatch<SetStateAction<T[]>>;
  status?: string;
  type: 'project' | 'smartQuery';
}

const DataCard = <T,>({
  className,
  getItemId,
  getItemTitle,
  getItemTimeCreated,
  getItemTimeUpdated,
  getItemBookmarkCount,
  getItemNoteCount,
  getItemStatus,
  getItemCount,
  item,
  onEdit,
  onShare,
  searchTerm,
  selectedItems,
  setSelectedItems,
  status,
  type
}: DataCardProps<T>) => {
  const navigate = useNavigate();

  const isUnassigned = getItemId(item) === -1;
  
  const title = getItemTitle(item);
  const time_created = getItemTimeCreated(item);
  const time_updated = getItemTimeUpdated(item);
  const bookmark_count =  getItemBookmarkCount(item);
  const note_count =  getItemNoteCount(item);
  const itemCount =  getItemCount?.(item);
  const itemStatus = getItemStatus?.(item);

  const isDeleted = type === 'project' ? (item as Project).deleted : (item as QueryStatusObject).data.deleted;

  const handleSelectItem = () => {
    setSelectedItems((prevItems) => {
      const isSelected = prevItems.some((i) => getItemId(i) === getItemId(item));
      return isSelected ? prevItems.filter((i) => getItemId(i) !== getItemId(item)) : [...prevItems, item];
    });
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(item);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(item);
    }
  };

  const handleCardClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button, input, a, [role="button"]');
    
    if (!isInteractive && type === 'project')
      navigate(`/projects/${getItemId(item)}`);
  };

  const handleRestore = (e: MouseEvent) => {
    e.stopPropagation();
    console.log('restore');
  };

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    console.log('delete');
  };

  return (
    <CardWrapper 
      className={`${styles.dataCard} ${className || ''} ${type === 'project' && styles.projectWrapper}`}
      onClick={handleCardClick}
    >
      <div className={`${styles.checkboxColumn} ${styles.column}`}>
        {
          !isUnassigned && (
            <Checkbox checked={selectedItems.some((i) => getItemId(i) === getItemId(item))} handleClick={handleSelectItem} />
          )
        }
      </div>
      <div className={`${styles.nameColumn} ${styles.column}`}>
        <div className={styles.nameContainer}>
          <CardName 
            type={type}
            name={title}
            itemCount={itemCount}
            searchTerm={searchTerm}
            isUnassigned={isUnassigned}
          />
          {
            isDeleted && (
              <div className={styles.deletedInteractions}>
                <span className={styles.interaction} onClick={handleRestore}>Restore Query</span>
                <span className={styles.separator}>·</span>
                <span className={styles.interaction} onClick={handleDelete}>Delete Now</span>
              </div>
            )
          }
        </div>

      </div>
      <div className={`${styles.actionsColumn} ${styles.column}`}>
        {
          (!isUnassigned && !isDeleted) && (
            <Button variant="secondary" iconOnly handleClick={handleEdit}>
              <EditIcon/>
            </Button>
          )
        }
        {
          (!isUnassigned && !isDeleted) && (
            <Button variant="secondary" iconOnly handleClick={handleShare}>
              <ShareIcon/>
            </Button>
          )
        }
      </div>
      <div className={`${styles.lastSeenColumn} ${styles.column}`}>
        {
          !isUnassigned && (
            <>
              {getFormattedDate(new Date(time_updated), false)}
            </>
          )
        }
      </div>
      <div className={`${styles.dateCreatedColumn} ${styles.column}`}>
      {
          !isUnassigned && (
            <>
              {getFormattedDate(new Date(time_created), false)}
            </>
          )
        }
      </div>
      <div className={`${styles.bookmarksColumn} ${styles.column}`}>
        {
          !isUnassigned && (
            <>
              <BookmarkIcon />
              {bookmark_count}
            </>
          )
        }
      </div>
      <div className={`${styles.notesColumn} ${styles.column}`}>
        {
          !isUnassigned && (
            <>
              <NoteIcon />
              {note_count}
            </>
          )
        }
      </div>
      <div className={`${styles.statusColumn} ${styles.column}`}>
        {
          !isUnassigned && (
            <>
              <StatusIndicator status={(status || itemStatus) as QueryStatus} />
            </>
          )
        }
      </div>
    </CardWrapper>
  );
}

export default DataCard; 