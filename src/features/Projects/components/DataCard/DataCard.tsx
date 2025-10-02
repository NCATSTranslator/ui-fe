import { Dispatch, SetStateAction, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DataCard.module.scss';
import { getFormattedDate, joinClasses } from '@/features/Common/utils/utilities';
import Button from '@/features/Core/components/Button/Button';
import ShareIcon from '@/assets/icons/buttons/Share.svg?react';
import CardWrapper from '@/features/Projects/components/CardWrapper/CardWrapper';
import StatusIndicator from '@/features/Projects/components/StatusIndicator/StatusIndicator';
import Checkbox from '@/features/Core/components/Checkbox/Checkbox';
import CardName from '@/features/Projects/components/CardName/CardName';
import BookmarkIcon from '@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react';
import NoteIcon from '@/assets/icons/buttons/Notes/Filled Notes.svg?react';
import ChevRightIcon from '@/assets/icons/directional/Chevron/Chevron Right.svg?react';
import TrashIcon from '@/assets/icons/buttons/Trash.svg?react';
import { DataCardLocation, Project, QueryStatus, UserQueryObject } from '@/features/Projects/types/projects';
import { getQueryLink } from '@/features/Projects/utils/utilities';
import { unableToReachLinkToast } from '@/features/Projects/utils/toastMessages';
import { isUnassignedProject } from '@/features/Projects/utils/editUpdateFunctions';

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
  inUnassignedProject?: boolean;
  isEditing?: boolean;
  item: T;
  location?: DataCardLocation;
  onEdit?: (item: T) => void;
  onShare?: (item: T) => void;
  onRestore?: (item: T) => void;
  onDelete?: (item: T) => void;
  queriesLoading?: boolean;
  searchTerm?: string;
  selectedItems: T[];
  setSelectedItems: Dispatch<SetStateAction<T[]>>;
  status?: QueryStatus;
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
  inUnassignedProject = false,
  isEditing = false,
  item,
  location = "list",
  onEdit,
  onShare,
  onRestore,
  onDelete,
  queriesLoading = false,
  searchTerm,
  selectedItems,
  setSelectedItems,
  status,
  type
}: DataCardProps<T>) => {
  const navigate = useNavigate();

  const isUnassignedPrj = type === 'project' ? isUnassignedProject(item as Project) : isUnassignedProject(getItemId(item) as number);
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

  // const handleEdit = () => {
  //   if (onEdit) {
  //     onEdit(item);
  //   }
  // };

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

    if(!isInteractive && type === 'smartQuery' || type === 'pathfinderQuery') {
      const url = getQueryLink(item as UserQueryObject);
      if(url) {
        window.open(encodeURI(`${url}`), "_blank", "noopener");
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

  const showCheckbox = location === 'list' || (location === 'detail' && (isEditing || inUnassignedProject));

  const classes = joinClasses(
    styles.dataCard,
    className,
    type === 'project' ? styles.projectCard : styles.queryCard,
    location === 'detail' && styles.detailCard,
    (isEditing || inUnassignedProject) && styles.isEditing,
    !showCheckbox && styles.noCheckbox
  )
  return (
    <CardWrapper 
      className={classes}
      onClick={handleCardClick}
    >
      {
        showCheckbox && (          
          <div className={`${styles.checkboxColumn} ${styles.column}`}>
            {
              !isUnassignedPrj && (
                <Checkbox checked={isSelected} handleClick={handleSelectItem} />
              )
            }
          </div>
        )
      }
      <div className={`${styles.nameColumn} ${styles.column}`}>
        <div className={styles.nameContainer}>
          <CardName
            type={type}
            name={title}
            itemCount={queriesLoading ? "-" : itemCount || 0}
            searchTerm={searchTerm}
            isUnassigned={isUnassignedPrj}
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
          (!isUnassignedPrj && !isDeleted) && (
            <Button variant="secondary" iconOnly handleClick={handleDelete} disabled={queriesLoading}>
              <TrashIcon/>
            </Button>
          )
        }
        {
          // (!isUnassignedPrj && !isDeleted) && (
          //   <Button variant="secondary" iconOnly handleClick={handleEdit} disabled={queriesLoading}>
          //     <EditIcon/>
          //   </Button>
          // )
        }
        {
          (!isUnassignedPrj && !isDeleted) && (
            <Button variant="secondary" iconOnly handleClick={handleShare}>
              <ShareIcon/>
            </Button>
          )
        }
      </div>
      <div className={`${styles.lastSeenColumn} ${styles.column}`}>
        {
          !isUnassignedPrj && (
            <>
              {getFormattedDate(new Date(time_updated), false)}
            </>
          )
        }
      </div>
      <div className={`${styles.dateCreatedColumn} ${styles.column}`}>
      {
          !isUnassignedPrj && (
            <>
              {getFormattedDate(new Date(time_created), false)}
            </>
          )
        }
      </div>
      <div className={`${styles.bookmarksColumn} ${styles.column}`}>
        {
          !isUnassignedPrj && (
            <>
              <BookmarkIcon />
              {bookmark_count}
            </>
          )
        }
      </div>
      <div className={`${styles.notesColumn} ${styles.column}`}>
        {
          !isUnassignedPrj && (
            <>
              <NoteIcon />
              {note_count}
            </>
          )
        }
      </div>
      <div className={`${styles.statusColumn} ${styles.column}`}>
        {
          !isUnassignedPrj && (
            <>
              <StatusIndicator status={(status || itemStatus) as QueryStatus} />
              <ChevRightIcon />
            </>
          )
        }
      </div>
    </CardWrapper>
  );
}

export default DataCard;
