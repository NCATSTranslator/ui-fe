import { FC, useCallback, useState } from "react";
import styles from './ResultItemInteractables.module.scss';
import { Link } from 'react-router-dom';
import ShareIcon from '@/assets/icons/buttons/Link.svg?react';
import Bookmark from "@/assets/icons/navigation/Bookmark/Bookmark.svg?react";
import BookmarkFilled from "@/assets/icons/navigation/Bookmark/Filled Bookmark.svg?react";
import Notes from "@/assets/icons/buttons/Notes/Notes.svg?react"
import NotesFilled from "@/assets/icons/buttons/Notes/Filled Notes.svg?react"
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import MenuIcon from '@/assets/icons/buttons/Dot Menu/Horizontal Dot Menu.svg?react';
import SummaryIcon from '@/assets/icons/buttons/Sparkles.svg?react';
import { useWindowSize } from "@/features/Common/hooks/customHooks";
import OutsideClickHandler from '@/features/Common/components/OutsideClickHandler/OutsideClickHandler';
import Button from "@/features/Core/components/Button/Button";
import { Result } from "@/features/ResultList/types/results";
import { useSelector } from "react-redux";
import { getResultSetById } from "@/features/ResultList/slices/resultsSlice";
import { useResultSummary } from "../../hooks/resultSummaryHooks";
import ResultItemSummaryModal from "../ResultItemSummaryModal/ResultItemSummaryModal";
import { useQueryClient } from "@tanstack/react-query";

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
  result: Result;
  hasSummary: boolean;
  pk: string | null;
  diseaseId: string;
  diseaseName: string;
  diseaseDescription: string;
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
  result,
  hasSummary,
  pk,
  diseaseId,
  diseaseName,
  diseaseDescription,
}) => {
  const resultSet = useSelector(getResultSetById(pk));
  const queryClient = useQueryClient()

  const { isLoading, error, refetch: fetchSummary } = useResultSummary(resultSet, result, diseaseId, diseaseName, diseaseDescription);

  const screenWidth = useWindowSize();
  const breakpoint = 1240;
  const belowBreakpoint = !!screenWidth?.width && screenWidth.width < breakpoint;
  const nameStringNoApostrophes = nameString.replaceAll("'", "");

  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const handleOutsideClick = useCallback(() => {
    if(isOpen)
      setIsOpen(false); 
  }, [isOpen]);

  const handleGenerateSummary = useCallback(() => {
    fetchSummary().then((res) => {
      setSummary(res?.data?.response_text || null);
    });
    setIsModalOpen(true);
  }, [fetchSummary]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSummary(null);
    queryClient.cancelQueries({ queryKey: ["resultSummary"] });
  }, []);

  return(
    <>
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
            !!hasSummary &&
            <Button
              className={`${styles.icon}`}
              variant="secondary"
              handleClick={handleGenerateSummary}
              dataTooltipId={`summary-tooltip-${nameStringNoApostrophes}`}
              small
            >
              <SummaryIcon
                aria-describedby={`summary-tooltip-${nameStringNoApostrophes}`}
              />
              <Tooltip id={`summary-tooltip-${nameStringNoApostrophes}`}>
                <span className={styles.tooltip}>Generate a summary of this result.</span>
              </Tooltip>
              <span className={styles.label}>Summary</span>
            </Button>
          }
          {
            (!!hasUser && !isPathfinder) &&
              <>
                <Button 
                  className={`${styles.icon} ${styles.bookmarkIcon} ${isBookmarked ? styles.filled : ''}`}
                  handleClick={handleBookmarkClick}
                  dataTooltipId={`bookmark-tooltip-${nameStringNoApostrophes}`}
                  variant="secondary"
                  small
                  >
                  <BookmarkFilled 
                    className={styles.bookmarkFilledSVG}
                    data-result-name={nameString}
                    aria-describedby={`bookmark-tooltip-${nameStringNoApostrophes}`} 
                  />
                  <Bookmark 
                    data-result-name={nameString}
                    aria-describedby={`bookmark-tooltip-${nameStringNoApostrophes}`} 
                  />
                  <Tooltip id={`bookmark-tooltip-${nameStringNoApostrophes}`}>
                    <span className={styles.tooltip}>
                      {
                        isBookmarked
                        ? <>Remove this bookmark.</>
                        : <>Bookmark this result to review it later in the <Link to="/workspace" target='_blank'>Workspace</Link>.</>
                      }
                    </span>
                  </Tooltip>
                  <span className={styles.label}>Bookmark</span>
                </Button>
                <Button 
                  className={`${styles.icon} ${styles.notesIcon} ${hasNotes ? styles.filled : ''}`}
                  handleClick={handleNotesClick}
                  dataTooltipId={`notes-tooltip-${nameStringNoApostrophes}`}
                  variant="secondary"
                  small
                  >
                  <NotesFilled 
                    className={styles.notesFilledSVG}
                    data-result-name={nameString}
                    aria-describedby={`notes-tooltip-${nameStringNoApostrophes}`}
                  />
                  <Notes 
                    className='note-icon'
                    data-result-name={nameString}
                    aria-describedby={`notes-tooltip-${nameStringNoApostrophes}`}
                  />
                  <Tooltip id={`notes-tooltip-${nameStringNoApostrophes}`}>
                    <span className={styles.tooltip}>Add your own custom notes to this result. <br/> (You can also view and edit notes on your<br/> bookmarked results in the <Link to="/workspace" target='_blank'>Workspace</Link>).</span>
                  </Tooltip>
                  <span className={styles.label}>Notes</span>
                </Button>
              </>
          }
          <Button
            className={`${styles.icon} ${styles.shareResultIcon} ${isExpanded ? styles.open : styles.closed } share-result-icon`}
            handleClick={handleOpenResultShare}
            dataTooltipId={`share-tooltip-${nameStringNoApostrophes}`}
            variant="secondary"
            small
            >
            <ShareIcon/>
            <Tooltip id={`share-tooltip-${nameStringNoApostrophes}`}>
              <span className={styles.tooltip}>Generate a sharable link for this result.</span>
            </Tooltip>
            <span className={styles.label}>Share</span>
          </Button>
        </div>
      </OutsideClickHandler>
      <ResultItemSummaryModal
        isOpen={isModalOpen}
        isLoading={isLoading}
        isError={!!error}
        summary={summary}
        onClose={handleCloseModal}
      />
    </>
  )
}

export default ResultItemInteractables;