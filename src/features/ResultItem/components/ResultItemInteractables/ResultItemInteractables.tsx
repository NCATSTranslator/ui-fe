import { FC, MouseEvent, useCallback, useState, useMemo } from "react";
import styles from './ResultItemInteractables.module.scss';
import MenuIcon from '@/assets/icons/buttons/Dot Menu/Horizontal Dot Menu.svg?react';
import OutsideClickHandler from '@/features/Core/components/OutsideClickHandler/OutsideClickHandler';
import { Result } from "@/features/ResultList/types/results";
import { useSelector } from "react-redux";
import { getResultSetById } from "@/features/ResultList/slices/resultsSlice";
import ResultItemSummaryModal from "@/features/ResultItem/components/ResultItemSummaryModal/ResultItemSummaryModal";
import { sanitizeNameString } from "@/features/ResultItem/hooks/useResultItemInteractables";
import { useResponsiveBreakpoint } from "@/features/Core/hooks/useResponsiveBreakpoint";
import SummaryButton from "@/features/ResultItem/components/ResultItemInteractables/SummaryButton";
import BookmarkButton from "@/features/ResultItem/components/ResultItemInteractables/BookmarkButton";
import NotesButton from "@/features/ResultItem/components/ResultItemInteractables/NotesButton";
import { useStreamingSummaryState } from "@/features/ResultItem/hooks/resultSummaryHooks";

interface ResultItemInteractablesProps {
  handleBookmarkClick: () => Promise<string | number | false | null>;
  handleNotesClick: () => Promise<void>;
  hasNotes: boolean;
  hasUser: boolean;
  isBookmarked: boolean;
  isEven: boolean;
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
  hasNotes,
  hasUser,
  isBookmarked,
  isEven,
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
  const belowBreakpoint = useResponsiveBreakpoint();
  const nameStringNoApostrophes = useMemo(() => sanitizeNameString(nameString), [nameString]);

  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    summaryState,
    isLoading,
    isStreaming,
    isError,
    streamedText,
    fetchAndUpdateSummary,
    clearAndRefetchSummary,
    cancelStream,
  } = useStreamingSummaryState({ resultSet, result, diseaseId, diseaseName, diseaseDescription });

  const handleOutsideClick = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  const handleGenerateSummary = useCallback(() => {
    setIsModalOpen(true);

    if (summaryState.content) {
      return;
    }

    fetchAndUpdateSummary();
  }, [summaryState.content, fetchAndUpdateSummary]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    cancelStream();
  }, [cancelStream]);

  // The whole result row navigates on click, so every control here has to keep
  // its own click from bubbling up to it.
  const stopPropagation = useCallback((e: MouseEvent) => e.stopPropagation(), []);

  return (
    <>
      <OutsideClickHandler
        className={`${styles.interactables} ${!!isEven && styles.even}`}
        onOutsideClick={handleOutsideClick}
      >
        {(belowBreakpoint && !isPathfinder) && (
          <button
            className={styles.icon}
            onClick={(e) => { e.stopPropagation(); setIsOpen(prev => !prev); }}
          >
            <MenuIcon/>
          </button>
        )}

        <div
          className={`${styles.interactablesContainer} ${belowBreakpoint && styles.belowBreakpoint} ${isOpen && styles.isOpen}`}
          onClick={stopPropagation}
        >
          <SummaryButton
            hasSummary={hasSummary}
            hasCachedSummary={summaryState.hasCached}
            onGenerateSummary={handleGenerateSummary}
            nameStringNoApostrophes={nameStringNoApostrophes}
          />

          <BookmarkButton
            hasUser={hasUser}
            isPathfinder={isPathfinder}
            isBookmarked={isBookmarked}
            onBookmarkClick={handleBookmarkClick}
            nameStringNoApostrophes={nameStringNoApostrophes}
          />

          <NotesButton
            hasUser={hasUser}
            isPathfinder={isPathfinder}
            hasNotes={hasNotes}
            onNotesClick={handleNotesClick}
            nameStringNoApostrophes={nameStringNoApostrophes}
          />
        </div>
      </OutsideClickHandler>

      <ResultItemSummaryModal
        isOpen={isModalOpen}
        isLoading={isLoading}
        isStreaming={isStreaming}
        isError={isError}
        summary={isStreaming ? streamedText : summaryState.content}
        onClose={handleCloseModal}
        onClearAndRefetchSummary={clearAndRefetchSummary}
        result={result}
      />
    </>
  );
};

export default ResultItemInteractables;
