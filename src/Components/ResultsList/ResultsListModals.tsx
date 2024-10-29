import { FC, Dispatch, SetStateAction } from "react";
import EvidenceModal from "../Modals/EvidenceModal";
import NotesModal from "../Modals/NotesModal";
import ShareModal from "../Modals/ShareModal";
import ResultFocusModal from "../Modals/ResultFocusModal";
import { ToastContainer, Slide } from 'react-toastify';
import { handleEvidenceModalClose } from "../../Utilities/resultsInteractionFunctions";

interface ResultsListModalsProps {
  parentStyles: {[key: string]: string};
  shareModalOpen: boolean;
  setShareModalOpen: Dispatch<SetStateAction<boolean>>;
  currentQueryID: string;
  shareResultID: string;
  notesModalOpen: boolean;
  setNotesModalOpen: Dispatch<SetStateAction<boolean>>;
  handleClearNotesEditor: () => Promise<void>;
  focusModalOpen: boolean;
  setFocusModalOpen: Dispatch<SetStateAction<boolean>>;
  noteLabel: string;
  currentBookmarkID: string | null | undefined;
  evidenceModalOpen: boolean;
  setEvidenceModalOpen: Dispatch<SetStateAction<boolean>>;
  selectedItem: any; 
  selectedEdge: any; 
  selectedPath: any; 
  sharedItem: any; 
  formattedResultsLength: number;
  presetTypeID: string;
  handlePageClick: (event: any, newItemsPerPage?: boolean, resultsLength?: number, currentNumItemsPerPage?: number) => void;
  setExpandSharedResult: Dispatch<SetStateAction<boolean>>;
  setAutoScrollToResult: Dispatch<SetStateAction<boolean>>;
}

const ResultsListModals: FC<ResultsListModalsProps> = ({
  shareModalOpen, 
  setShareModalOpen, 
  notesModalOpen, 
  setNotesModalOpen, 
  handleClearNotesEditor, 
  noteLabel, 
  currentBookmarkID, 
  currentQueryID, 
  shareResultID, 
  focusModalOpen, 
  setFocusModalOpen, 
  evidenceModalOpen, 
  setEvidenceModalOpen, 
  selectedEdge, 
  selectedItem, 
  selectedPath, 
  sharedItem, 
  formattedResultsLength, 
  presetTypeID, 
  handlePageClick, 
  setExpandSharedResult, 
  setAutoScrollToResult }) => {

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
        qid={currentQueryID}
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
        item={selectedItem}
        edgeGroup={selectedEdge}
        path={selectedPath}
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