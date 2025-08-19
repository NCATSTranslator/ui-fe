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
import { Project, QueryStatus, UserQueryObject } from '@/features/Projects/types/projects';
import { getPathfinderResultsShareURLPath, getResultsShareURLPath } from '@/features/ResultList/utils/resultsInteractionFunctions';
import { getTypeIDFromType } from '@/features/Projects/utils/utilities';
import { AutocompleteItem } from '@/features/Query/types/querySubmission';
import { unableToReachLinkToast } from '../../utils/toastMessages';

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
  onRestore?: (item: T) => void;
  onDelete?: (item: T) => void;
  searchTerm?: string;
  selectedItems: T[];
  setSelectedItems: Dispatch<SetStateAction<T[]>>;
  status?: string;
  type: 'project' | 'smartQuery' | 'pathfinderQuery';
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
  onRestore,
  onDelete,
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
  const isSelected = selectedItems.some((i) => getItemId(i) === getItemId(item));

  const isDeleted = type === 'project' ? (item as Project).deleted : (item as UserQueryObject).data.deleted;

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
    
    if (!isInteractive && type === 'project') {
      navigate(`/projects/${getItemId(item)}`);
      return;
    }

    if(!isInteractive && type === 'smartQuery') {
      const query = item as UserQueryObject;
      const curie = query.data.query.curie || '';
      const label = query.data.query.node_one_label || curie|| '';
      const type = query.data.query.type;
      const direction = query.data.query.direction || null;
      const typeID = getTypeIDFromType(type, direction);
      const qid = query.data.qid;
      const url = getResultsShareURLPath(label, curie, typeID, "0", qid);
      window.open(url, "_blank", "noopener");
      return;
    }

    if(!isInteractive && type === 'pathfinderQuery') {
      const query = item as UserQueryObject;
      if(query.data.query.type === 'pathfinder' && query.data.query.subject && query.data.query.object) {
        const itemOne: AutocompleteItem = {
          id: query.data.query.subject.id,
          label: query.data.query.node_one_label || query.data.query.subject.id,
        }
        const itemTwo: AutocompleteItem = {
          id: query.data.query.object.id,
          label: query.data.query.node_two_label || query.data.query.object.id,
        }
        const constraint = query.data.query.constraint || undefined;
        const qid = query.data.qid;
        const url = getPathfinderResultsShareURLPath(itemOne, itemTwo, "0", constraint, qid);
        window.open(url, "_blank", "noopener");
        return;
      }
      unableToReachLinkToast();
      return;
    }
  };

  const handleRestore = (e: MouseEvent) => {
    e.stopPropagation();
    if (onRestore)
      onRestore(item);
  };

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation(); 
    if (onDelete)
      onDelete(item);
  };

  return (
    <CardWrapper 
      className={`${styles.dataCard} ${className || ''} ${type === 'project' && styles.projectWrapper}`}
      onClick={handleCardClick}
    >
      <div className={`${styles.checkboxColumn} ${styles.column}`}>
        {
          !isUnassigned && (
            <Checkbox checked={isSelected} handleClick={handleSelectItem} />
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
                <span className={styles.interaction} onClick={handleRestore}>Restore {type === 'project' ? 'Project' : 'Query'}</span>
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