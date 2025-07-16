import { FC, useCallback, useState } from "react";
import styles from './ResultItemInteractables.module.scss';
import { Link } from 'react-router-dom';
import ShareIcon from '@/assets/icons/buttons/Share.svg?react';
import Bookmark from "@/assets/icons/navigation/Bookmark/Bookmark.svg?react";
import BookmarkFilled from "@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react";
import Notes from "@/assets/icons/buttons/Notes/Notes.svg?react"
import NotesFilled from "@/assets/icons/buttons/Notes/Filled Notes.svg?react"
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import MenuIcon from '@/assets/icons/buttons/Dot Menu/Horizontal Dot Menu.svg?react';
import { useWindowSize } from "@/features/Common/hooks/customHooks";
import OutsideClickHandler from '@/features/Common/components/OutsideClickHandler/OutsideClickHandler';

interface ResultItemInteractablesProps {
  handleBookmarkClick: () => Promise<string | number | false | null>;
  handleNotesClick: () => Promise<void>;
  handleOpenResultShare: () => void;
  hasNotes: boolean;
  hasUser: boolean;
  isBookmarked: boolean;
  isEven: boolean;
  isExpanded: boolean;
  isPathfinder: boolean;
  nameString: string;
}

const ResultItemInteractables: FC<ResultItemInteractablesProps> = ({
  handleBookmarkClick,
  handleNotesClick,
  handleOpenResultShare,
  hasNotes,
  hasUser,
  isBookmarked,
  isEven,
  isExpanded,
  isPathfinder,
  nameString,
}) => {

  const screenWidth = useWindowSize();
  const breakpoint = 1240;
  const belowBreakpoint = !!screenWidth?.width && screenWidth.width < breakpoint;

  const [isOpen, setIsOpen] = useState(false); 

  const handleOutsideClick = useCallback(() => {
    if(isOpen)
      setIsOpen(false); 
  }, [isOpen]);

  return(
    <OutsideClickHandler 
      className={`${styles.interactables} ${!!isEven && styles.even}`}
      onOutsideClick={handleOutsideClick}>
      {
        !!belowBreakpoint &&
        <button className={`${styles.icon}`} onClick={()=>setIsOpen(prev=>!prev)}>
          <MenuIcon/>
        </button>
      }
      <div className={`${styles.interactablesContainer} ${!!belowBreakpoint && styles.belowBreakpoint} ${!!isOpen && styles.isOpen}`}>
        {
          !!hasUser && !isPathfinder
            ? <>
                <button 
                  className={`${styles.icon} ${styles.bookmarkIcon} ${isBookmarked ? styles.filled : ''}`}
                  onClick={handleBookmarkClick}
                  data-tooltip-id={`bookmark-tooltip-${nameString.replaceAll("'", "")}`} 
                  >
                  <BookmarkFilled 
                    className={styles.bookmarkFilledSVG}
                    data-result-name={nameString}
                    aria-describedby={`bookmark-tooltip-${nameString.replaceAll("'", "")}`} 
                  />
                  <Bookmark 
                    data-result-name={nameString}
                    aria-describedby={`bookmark-tooltip-${nameString.replaceAll("'", "")}`} 
                  />
                  <Tooltip id={`bookmark-tooltip-${nameString.replaceAll("'", "")}`}>
                    <span className={styles.tooltip}>
                      {
                        isBookmarked
                        ? <>Remove this bookmark.</>
                        : <>Bookmark this result to review it later in the <Link to="/workspace" target='_blank'>Workspace</Link>.</>
                      }
                    </span>
                  </Tooltip>
                  <span className={styles.label}>Bookmark</span>
                </button>
                <button 
                  className={`${styles.icon} ${styles.notesIcon} ${hasNotes ? styles.filled : ''}`}
                  onClick={handleNotesClick}
                  data-tooltip-id={`notes-tooltip-${nameString.replaceAll("'", "")}`}
                  >
                  <NotesFilled 
                    className={styles.notesFilledSVG}
                    data-result-name={nameString}
                    aria-describedby={`notes-tooltip-${nameString.replaceAll("'", "")}`}
                  />
                  <Notes 
                    className='note-icon'
                    data-result-name={nameString}
                    aria-describedby={`notes-tooltip-${nameString.replaceAll("'", "")}`}
                  />
                  <Tooltip id={`notes-tooltip-${nameString.replaceAll("'", "")}`}>
                    <span className={styles.tooltip}>Add your own custom notes to this result. <br/> (You can also view and edit notes on your<br/> bookmarked results in the <Link to="/workspace" target='_blank'>Workspace</Link>).</span>
                  </Tooltip>
                  <span className={styles.label}>Notes</span>
                </button>
              </>
            : <></>
        }
        <button
          className={`${styles.icon} ${styles.shareResultIcon} ${isExpanded ? styles.open : styles.closed } share-result-icon`}
          onClick={handleOpenResultShare}
          data-tooltip-id={`share-tooltip-${nameString.replaceAll("'", "")}`}
          >
          <ShareIcon/>
          <Tooltip id={`share-tooltip-${nameString.replaceAll("'", "")}`}>
            <span className={styles.tooltip}>Generate a sharable link for this result.</span>
          </Tooltip>
          <span className={styles.label}>Share</span>
        </button>
      </div>
    </OutsideClickHandler>

  )
}

export default ResultItemInteractables;