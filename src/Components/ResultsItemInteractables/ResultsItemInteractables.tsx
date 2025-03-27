import { FC } from "react";
import styles from './ResultsItemInteractables.module.scss';
import { Link } from 'react-router-dom';
import ShareIcon from '../../Icons/Buttons/Link.svg?react';
import Bookmark from "../../Icons/Navigation/Bookmark/Bookmark.svg?react";
import BookmarkFilled from "../../Icons/Navigation/Bookmark/Filled Bookmark.svg?react";
import Notes from "../../Icons/Buttons/Notes/Notes.svg?react"
import NotesFilled from "../../Icons/Buttons/Notes/Filled Notes.svg?react"
import Tooltip from '../Tooltip/Tooltip';
import { useWindowSize } from "../../Utilities/customHooks";

interface ResultsItemInteractablesProps {
  handleBookmarkClick: () => Promise<any>;
  handleNotesClick: () => Promise<void>,
  handleOpenResultShare: () => void,
  hasNotes: boolean;
  hasUser: boolean;
  isBookmarked: boolean;
  isEven: boolean;
  isExpanded: boolean;
  isPathfinder: boolean;
  nameString: string;
}

const ResultsItemInteractables: FC<ResultsItemInteractablesProps> = ({
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

  return(
    <div className={`${styles.interactables} ${!!isEven && styles.even}`}>
      {
        !!hasUser && !isPathfinder
          ? <>
              <div className={`${styles.icon} ${styles.bookmarkIcon} ${isBookmarked ? styles.filled : ''}`}>
                <BookmarkFilled 
                  className={styles.bookmarkFilledSVG}
                  data-result-name={nameString}
                  onClick={handleBookmarkClick}
                  data-tooltip-id={`bookmark-tooltip-${nameString.replaceAll("'", "")}`} 
                  aria-describedby={`bookmark-tooltip-${nameString.replaceAll("'", "")}`} 
                />
                <Bookmark 
                  data-result-name={nameString}
                  onClick={handleBookmarkClick}
                  data-tooltip-id={`bookmark-tooltip-${nameString.replaceAll("'", "")}`}
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
              </div>
              <div className={`${styles.icon} ${styles.notesIcon} ${hasNotes ? styles.filled : ''}`}>
                <NotesFilled 
                  className={styles.notesFilledSVG}
                  data-result-name={nameString}
                  onClick={handleNotesClick}
                  data-tooltip-id={`notes-tooltip-${nameString.replaceAll("'", "")}`}
                  aria-describedby={`notes-tooltip-${nameString.replaceAll("'", "")}`}
                />
                <Notes 
                  className='note-icon'
                  data-result-name={nameString}
                  onClick={handleNotesClick}
                  data-tooltip-id={`notes-tooltip-${nameString.replaceAll("'", "")}`}
                  aria-describedby={`notes-tooltip-${nameString.replaceAll("'", "")}`}
                />
                <Tooltip id={`notes-tooltip-${nameString.replaceAll("'", "")}`}>
                  <span className={styles.tooltip}>Add your own custom notes to this result. <br/> (You can also view and edit notes on your<br/> bookmarked results in the <Link to="/workspace" target='_blank'>Workspace</Link>).</span>
                </Tooltip>
              </div>
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
        </button>
      </div>
  )
}

export default ResultsItemInteractables;