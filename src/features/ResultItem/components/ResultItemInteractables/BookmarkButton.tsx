import { FC } from "react";
import { Link } from 'react-router-dom';
import Bookmark from "@/assets/icons/navigation/Bookmark/Bookmark.svg?react";
import BookmarkFilled from "@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react";
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import Button from "@/features/Core/components/Button/Button";
import styles from './ResultItemInteractables.module.scss';

interface BookmarkButtonProps {
  hasUser: boolean;
  isPathfinder: boolean;
  isBookmarked: boolean;
  onBookmarkClick: () => Promise<string | number | false | null>;
  nameStringNoApostrophes: string;
}

const BookmarkButton: FC<BookmarkButtonProps> = ({
  hasUser,
  isPathfinder,
  isBookmarked,
  onBookmarkClick,
  nameStringNoApostrophes
}) => {
  if (!hasUser || isPathfinder) return null;

  return (
    <Button 
      className={`${styles.icon} ${styles.bookmarkIcon} ${isBookmarked ? styles.filled : ''}`}
      handleClick={onBookmarkClick}
      dataTooltipId={`bookmark-tooltip-${nameStringNoApostrophes}`}
      variant="secondary"
      small
    >
      <BookmarkFilled 
        className={styles.bookmarkFilledSVG}
        data-result-name={nameStringNoApostrophes}
        aria-describedby={`bookmark-tooltip-${nameStringNoApostrophes}`} 
      />
      <Bookmark 
        data-result-name={nameStringNoApostrophes}
        aria-describedby={`bookmark-tooltip-${nameStringNoApostrophes}`} 
      />
      <Tooltip id={`bookmark-tooltip-${nameStringNoApostrophes}`}>
        <span className={styles.tooltip}>
          {isBookmarked ? (
            <>Remove this bookmark.</>
          ) : (
            <>Bookmark this result to review it later in the <Link to="/workspace" target='_blank'>Workspace</Link>.</>
          )}
        </span>
      </Tooltip>
      <span className={styles.label}>Bookmark</span>
    </Button>
  );
};

export default BookmarkButton; 