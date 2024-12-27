import { FC, Dispatch, SetStateAction } from "react";
import EvidenceModal from "../Modals/EvidenceModal";
import NotesModal from "../Modals/NotesModal";
import ShareModal from "../Modals/ShareModal";
import ResultFocusModal from "../Modals/ResultFocusModal";
import { ToastContainer, Slide } from 'react-toastify';
import { handleEvidenceModalClose } from "../../Utilities/resultsInteractionFunctions";
import { Path, ResultEdge } from "../../Types/results";

interface ResultsListModalsProps {
  currentBookmarkID: string | null | undefined;
  evidenceModalOpen: boolean;
  focusModalOpen: boolean;
  formattedResultsLength: number;
  handleClearNotesEditor: () => Promise<void>;
  handlePageClick: (event: any, newItemsPerPage?: number | false, resultsLength?: number, currentNumItemsPerPage?: number) => void;
  noteLabel: string;
  notesModalOpen: boolean;
  pk: string;
  presetTypeID: string;
  selectedEdge: ResultEdge | null; 
  selectedPath: Path | null; 
  selectedResult: any; 
  setAutoScrollToResult: Dispatch<SetStateAction<boolean>>;
  setExpandSharedResult: Dispatch<SetStateAction<boolean>>;
  setEvidenceModalOpen: Dispatch<SetStateAction<boolean>>;
  setFocusModalOpen: Dispatch<SetStateAction<boolean>>;
  setNotesModalOpen: Dispatch<SetStateAction<boolean>>;
  setShareModalOpen: Dispatch<SetStateAction<boolean>>;
  sharedItem: any; 
  shareModalOpen: boolean;
  shareResultID: string;
}

const ResultsListModals: FC<ResultsListModalsProps> = ({
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

export default ResultsListModals;