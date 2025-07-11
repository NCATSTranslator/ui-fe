import { FC, Dispatch, SetStateAction } from "react";
import EvidenceModal from "@/features/Evidence/components/EvidenceModal/EvidenceModal";
import NotesModal from "@/features/ResultItem/components/NotesModal/NotesModal";
import ShareModal from "@/features/ResultList/components/ShareModal/ShareModal";
import ResultFocusModal from "@/features/ResultList/components/ResultFocusModal/ResultFocusModal";
import { ToastContainer, Slide } from 'react-toastify';
import { handleEvidenceModalClose } from "@/features/ResultList/utils/resultsInteractionFunctions";
import { Path, Result, ResultEdge, SharedItem } from "@/features/ResultList/types/results.d";

interface ResultListModalsProps {
  currentBookmarkID: string | null | undefined;
  evidenceModalOpen: boolean;
  focusModalOpen: boolean;
  formattedResultsLength: number;
  handleClearNotesEditor: () => Promise<void>;
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
}

const ResultListModals: FC<ResultListModalsProps> = ({
  currentBookmarkID,
  evidenceModalOpen,
  focusModalOpen,
  formattedResultsLength,
  handleClearNotesEditor,
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
}) => {

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        theme="light"
        transition={Slide}
        pauseOnFocusLoss={false}
        hideProgressBar
        className="toastContainer"
        closeOnClick={false}
        closeButton={false}
      />
      <ShareModal
        isOpen={shareModalOpen}
        onClose={()=>setShareModalOpen(false)}
        qid={pk}
        shareResultID={shareResultID}
      />
      <NotesModal
        isOpen={notesModalOpen}
        onClose={()=>(setNotesModalOpen(false))}
        handleClearNotesEditor={handleClearNotesEditor}
        noteLabel={noteLabel}
        bookmarkID={currentBookmarkID}
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