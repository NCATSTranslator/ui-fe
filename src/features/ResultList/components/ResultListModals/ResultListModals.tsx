import { FC, Dispatch, SetStateAction, RefObject } from "react";
import EvidenceModal from "@/features/Evidence/components/EvidenceModal/EvidenceModal";
import NotesModal from "@/features/ResultItem/components/NotesModal/NotesModal";
import ShareModal from "@/features/ResultList/components/ShareModal/ShareModal";
import ResultFocusModal from "@/features/ResultList/components/ResultFocusModal/ResultFocusModal";
import { handleEvidenceModalClose } from "@/features/ResultList/utils/resultsInteractionFunctions";
import { Path, Result, ResultEdge, SharedItem } from "@/features/ResultList/types/results.d";
import { SaveGroup } from "@/features/UserAuth/utils/userApi";

interface ResultListModalsProps {
  currentBookmarkID: RefObject<string | null>;
  evidenceModalOpen: boolean;
  focusModalOpen: boolean;
  formattedResultsLength: number;
  handlePageClick: (event: {selected: number}, newItemsPerPage?: number | false, resultsLength?: number, currentNumItemsPerPage?: number) => void;
  noteLabel: string;
  notesModalOpen: boolean;
  pk: string;
  presetTypeID: string;
  selectedEdge: ResultEdge | null; 
  selectedPath: Path | null;
  selectedPathKey: string;
  selectedResult: Result | null; 
  setAutoScrollToResult: Dispatch<SetStateAction<boolean>>;
  setExpandSharedResult: Dispatch<SetStateAction<boolean>>;
  setEvidenceModalOpen: Dispatch<SetStateAction<boolean>>;
  setFocusModalOpen: Dispatch<SetStateAction<boolean>>;
  setNotesModalOpen: Dispatch<SetStateAction<boolean>>;
  setShareModalOpen: Dispatch<SetStateAction<boolean>>;
  sharedItem: SharedItem; 
  shareModalOpen: boolean;
  shareResultID: string;
  shouldUpdateResultsAfterBookmark: RefObject<boolean>;
  updateUserSaves: Dispatch<SetStateAction<SaveGroup | null>>;
}

const ResultListModals: FC<ResultListModalsProps> = ({
  currentBookmarkID,
  evidenceModalOpen,
  focusModalOpen,
  formattedResultsLength,
  handlePageClick,
  noteLabel,
  notesModalOpen,
  pk,
  presetTypeID,
  selectedEdge,
  selectedPath,
  selectedPathKey,
  selectedResult,
  setAutoScrollToResult,
  setExpandSharedResult,
  setEvidenceModalOpen,
  setFocusModalOpen,
  setNotesModalOpen,
  setShareModalOpen,
  sharedItem,
  shareModalOpen,
  shareResultID,
  shouldUpdateResultsAfterBookmark,
  updateUserSaves,
}) => {

  const handleNotesModalClose = () => {
    setNotesModalOpen(false);
  }

  return (
    <>
      <ShareModal
        isOpen={shareModalOpen}
        onClose={()=>setShareModalOpen(false)}
        qid={pk}
        shareResultID={shareResultID}
      />
      <NotesModal
        isOpen={notesModalOpen}
        onClose={handleNotesModalClose}
        noteLabel={noteLabel}
        currentBookmarkID={currentBookmarkID}
        updateUserSaves={updateUserSaves}
        shouldUpdateResultsAfterBookmark={shouldUpdateResultsAfterBookmark}
      />
      <EvidenceModal
        isOpen={evidenceModalOpen}
        onClose={()=>handleEvidenceModalClose(setEvidenceModalOpen)}
        result={selectedResult}
        edge={selectedEdge}
        path={selectedPath}
        pathKey={selectedPathKey}
        pk={pk}
      />
      <ResultFocusModal
        isOpen={focusModalOpen}
        onAccept={() => {
          setFocusModalOpen(false);
          handlePageClick({selected: sharedItem.page}, false, formattedResultsLength);
          setExpandSharedResult(true);
          setAutoScrollToResult(true);
        }}
        onReject={() => setFocusModalOpen(false)}
        sharedItem={sharedItem}
        queryType={presetTypeID}
      />
    </>
  );
}

export default ResultListModals;