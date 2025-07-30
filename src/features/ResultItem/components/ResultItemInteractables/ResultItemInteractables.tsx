import { FC, useCallback, useState, useMemo } from "react";
import styles from './ResultItemInteractables.module.scss';
import MenuIcon from '@/assets/icons/buttons/Dot Menu/Horizontal Dot Menu.svg?react';
import OutsideClickHandler from '@/features/Common/components/OutsideClickHandler/OutsideClickHandler';
import { Result } from "@/features/ResultList/types/results";
import { useSelector } from "react-redux";
import { getResultSetById } from "@/features/ResultList/slices/resultsSlice";
import { useResultSummary } from "@/features/ResultItem/hooks/resultSummaryHooks";
import ResultItemSummaryModal from "@/features/ResultItem/components/ResultItemSummaryModal/ResultItemSummaryModal";
import { useQueryClient } from "@tanstack/react-query";
import { useSummaryState, sanitizeNameString } from "@/features/ResultItem/hooks/useResultItemInteractables";
import { useResponsiveBreakpoint } from "@/features/Common/hooks/customHooks";
import SummaryButton from "@/features/ResultItem/components/ResultItemInteractables/SummaryButton";
import BookmarkButton from "@/features/ResultItem/components/ResultItemInteractables/BookmarkButton";
import NotesButton from "@/features/ResultItem/components/ResultItemInteractables/NotesButton";
import ShareButton from "@/features/ResultItem/components/ResultItemInteractables/ShareButton";

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
  const queryClient = useQueryClient();
  const belowBreakpoint = useResponsiveBreakpoint();
  const nameStringNoApostrophes = useMemo(() => sanitizeNameString(nameString), [nameString]);

  const { error, refetch: fetchSummary } = useResultSummary(
    resultSet, 
    result, 
    diseaseId, 
    diseaseName, 
    diseaseDescription
  );


  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { summaryState, isLoading: summaryIsLoading, fetchAndUpdateSummary, clearAndRefetchSummary } = useSummaryState(
    result.id, 
    fetchSummary
  );

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

  const handleClearAndRefetchSummary = useCallback(() => {
    clearAndRefetchSummary();
  }, [clearAndRefetchSummary]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    queryClient.cancelQueries({ queryKey: ["resultSummary"] });
  }, [queryClient]);

  return (
    <>
      <OutsideClickHandler 
        className={`${styles.interactables} ${!!isEven && styles.even}`}
        onOutsideClick={handleOutsideClick}
      >
        {belowBreakpoint && (
          <button className={styles.icon} onClick={() => setIsOpen(prev => !prev)}>
            <MenuIcon/>
          </button>
        )}
        
        <div className={`${styles.interactablesContainer} ${belowBreakpoint && styles.belowBreakpoint} ${isOpen && styles.isOpen}`}>
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
          
          <ShareButton
            isExpanded={isExpanded}
            onShareClick={handleOpenResultShare}
            nameStringNoApostrophes={nameStringNoApostrophes}
          />
        </div>
      </OutsideClickHandler>
      
      <ResultItemSummaryModal
        isOpen={isModalOpen}
        isLoading={summaryIsLoading}
        isError={!!error}
        summary={summaryState.content}
        onClose={handleCloseModal}
        onClearAndRefetchSummary={handleClearAndRefetchSummary}
      />
    </>
  );
};

export default ResultItemInteractables;