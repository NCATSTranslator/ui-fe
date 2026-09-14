import { FC, Dispatch, SetStateAction, RefObject } from "react";
import NotesModal from "@/features/ResultItem/components/NotesModal/NotesModal";
import ShareModal from "@/features/ResultList/components/ShareModal/ShareModal";
import ResultFocusModal from "@/features/ResultList/components/ResultFocusModal/ResultFocusModal";
import { SharedItem } from "@/features/ResultList/types/results.d";
import { SaveGroup } from "@/features/UserAuth/utils/userApi";

interface ResultListModalsProps {
  currentBookmarkID: string | null;
  focusModalOpen: boolean;
  formattedResultsLength: number;
  /** Untracked page change: accepting the focus modal is not a user paging through results. */
  handlePageChange: (event: {selected: number}, newItemsPerPage?: number | false, resultsLength?: number, currentNumItemsPerPage?: number) => void;
  noteLabel: string;
  notesModalOpen: boolean;
  onCloseNotesModal: () => void;
  pk: string;
  presetTypeID: string;
  setAutoScrollToResult: Dispatch<SetStateAction<boolean>>;
  setExpandSharedResult: Dispatch<SetStateAction<boolean>>;
  setFocusModalOpen: Dispatch<SetStateAction<boolean>>;
  setShareModalOpen: Dispatch<SetStateAction<boolean>>;
  sharedItem: SharedItem;
  shareModalOpen: boolean;
  shareResultID: string;
  shouldUpdateResultsAfterBookmark: RefObject<boolean>;
  updateUserSaves: Dispatch<SetStateAction<SaveGroup | null>>;
}

const ResultListModals: FC<ResultListModalsProps> = ({
  currentBookmarkID,
  focusModalOpen,
  formattedResultsLength,
  handlePageChange,
  noteLabel,
  notesModalOpen,
  onCloseNotesModal,
  pk,
  presetTypeID,
  setAutoScrollToResult,
  setExpandSharedResult,
  setFocusModalOpen,
  setShareModalOpen,
  sharedItem,
  shareModalOpen,
  shareResultID,
  shouldUpdateResultsAfterBookmark,
  updateUserSaves,
}) => {
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
        onClose={onCloseNotesModal}
        noteLabel={noteLabel}
        currentBookmarkID={currentBookmarkID}
        updateUserSaves={updateUserSaves}
        shouldUpdateResultsAfterBookmark={shouldUpdateResultsAfterBookmark}
      />
      <ResultFocusModal
        isOpen={focusModalOpen}
        onAccept={() => {
          setFocusModalOpen(false);
          handlePageChange({selected: sharedItem.page}, false, formattedResultsLength);
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
