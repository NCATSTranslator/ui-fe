import { useState, useEffect, useCallback, FC, RefObject, Dispatch, SetStateAction, useRef } from "react";
import styles from "./NotesModal.module.scss";
import Modal from "@/features/Common/components/Modal/Modal";
import TextEditor from "@/features/Common/components/TextEditor/TextEditor";
import Button from "@/features/Core/components/Button/Button";
import { getUserSave, Save, SaveGroup, updateUserSave } from "@/features/UserAuth/utils/userApi";
import { updateUserSavesState } from "@/features/ResultItem/utils/bookmarkFunctions";

interface NotesModalProps {
  currentBookmarkID: string | null;
  isOpen?: boolean;
  noteLabel?: string;
  onClose?: () => void;
  shouldUpdateResultsAfterBookmark: RefObject<boolean>;
  updateUserSaves: Dispatch<SetStateAction<SaveGroup | null>>;
}

const NotesModal: FC<NotesModalProps> = ({
  currentBookmarkID, 
  isOpen = false, 
  noteLabel = "", 
  onClose = ()=>{}, 
  shouldUpdateResultsAfterBookmark,
  updateUserSaves,
}) => {

  const startOpen = (isOpen === undefined) ? false : isOpen;
  const [showSaved, setShowSaved] = useState(false);
  const [triggerClearEditor, setTriggerClearEditor] = useState(false);
  const [confirmClearNote, setConfirmClearNote] = useState(false);
  const localBookmarkItem = useRef<Save | null>(null);
  const saveNowRef = useRef<(() => Promise<void>) | null>(null);
  const isClosing = useRef(false);

  const onNoteSaved = useCallback((save: Save) => {
    localBookmarkItem.current = save;
    updateUserSavesState('updateNote', updateUserSaves, save.object_ref, save);
    if (shouldUpdateResultsAfterBookmark)
      shouldUpdateResultsAfterBookmark.current = true;
  }, [updateUserSaves, shouldUpdateResultsAfterBookmark]);

  const handleClose = useCallback(() => {
    if (isClosing.current) return;
    isClosing.current = true;
    setConfirmClearNote(false);

    // Flush any pending save in background (fire-and-forget)
    // The save's onNoteSaved callback handles updating parent state
    const saveNowFn = saveNowRef.current;
    if (saveNowFn) {
      saveNowFn()
        .catch(err => console.error("Failed to save note on close:", err))
        .finally(() => { isClosing.current = false; });
    } else {
      isClosing.current = false;
    }

    // Close immediately for responsive UX
    localBookmarkItem.current = null;
    onClose();
  }, [onClose]);

  const handleSave = useCallback(() => {
    setShowSaved(true);
  }, []);

  const handleClearNote = async () => {
    if(!currentBookmarkID) {
      console.warn("No bookmarkID, unable to clear note");
      return;
    }

    const newSave: Save = await getUserSave(currentBookmarkID);
    newSave.notes = "";
    await updateUserSave(currentBookmarkID, newSave);

    // Update parent state so icon reflects cleared note
    updateUserSavesState('updateNote', updateUserSaves, newSave.object_ref, newSave);
    if (shouldUpdateResultsAfterBookmark)
      shouldUpdateResultsAfterBookmark.current = true;

    // Reset local state and close modal directly (skip handleClose to avoid
    // re-saving editor content that hasn't cleared yet)
    localBookmarkItem.current = null;
    setConfirmClearNote(false);
    onClose();
  };

  const handleEditorCleared = () => {
    setTriggerClearEditor(false);
  }

  useEffect(() => {
    if(showSaved === false)
      return;
    
    const timer = setTimeout(() => setShowSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [showSaved]);

  return (
    <Modal 
      isOpen={startOpen} 
      onClose={handleClose} 
      className={styles.notesModal}
      containerClass={styles.notesContainer}
      >
        <div className={`${confirmClearNote ? styles.show : styles.hide} ${styles.clearConfirmation}`}>
          <div className={styles.clearConfirmationContainer}>
            <h5>Are you sure you want to clear this note?</h5>
            <p className="bold ">This is permanent and cannot be undone.</p>
            <div className={styles.buttons}>
              <Button handleClick={() => setConfirmClearNote(false)} className={styles.button} variant="secondary">Keep Note</Button>
              <Button handleClick={handleClearNote} className={styles.button} >Clear Note</Button>
            </div>
          </div>
        </div>
        <div className={styles.top}>
          {
            noteLabel 
            ? 
              <h5 className={styles.heading}>
                <span className={styles.prefix}>Showing Notes for: </span>
                <span className={styles.item}>{noteLabel}</span>
                <span className={`${styles.saved} ${showSaved ? styles.show : styles.hide}`}>Note Saved</span>
              </h5>
            : 
              <h5 className={styles.heading}>
                <span className={styles.prefix}>Notes:</span>
                <span className={`${styles.saved} ${showSaved ? styles.show : styles.hide}`}>Note Saved</span>
              </h5>
          }
        </div>
      <TextEditor
        bookmarkID={currentBookmarkID}
        isOpen={isOpen}
        handleSave={handleSave}
        shouldClearEditor={triggerClearEditor}
        onClearEditorComplete={handleEditorCleared}
        onNoteSaved={onNoteSaved}
        saveNowRef={saveNowRef}
      />
      <div className={styles.bottomButtons}>
        <Button
          handleClick={async () => {
            try {
              await saveNowRef.current?.();
            } finally {
              handleSave();
            }
          }}
          className={styles.saveButton}
        >
          Save Note
        </Button>
        <Button handleClick={() => setConfirmClearNote(true)} className={styles.clearButton} >Clear Note</Button>
      </div>
    </Modal>
  );
}


export default NotesModal;

