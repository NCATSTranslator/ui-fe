import { useState, useEffect, useCallback, FC, RefObject, Dispatch, SetStateAction, useRef } from "react";
import styles from "./NotesModal.module.scss";
import Modal from "@/features/Common/components/Modal/Modal";
import TextEditor from "@/features/Common/components/TextEditor/TextEditor";
import Button from "@/features/Core/components/Button/Button";
import { getUserSave, Save, SaveGroup, updateUserSave } from "@/features/UserAuth/utils/userApi";
import { updateUserSavesState } from "../../utils/bookmarkFunctions";

interface NotesModalProps {
  currentBookmarkID: RefObject<string | null>;
  handleClearNotesEditor: () => void;
  isOpen?: boolean;
  noteLabel?: string;
  onClose?: () => void;
  shouldUpdateResultsAfterBookmark: RefObject<boolean>;
  updateUserSaves: Dispatch<SetStateAction<SaveGroup | null>>;
}

const NotesModal: FC<NotesModalProps> = ({
  currentBookmarkID, 
  handleClearNotesEditor = ()=>{},
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
  const [bookmarkedItem, setBookmarkedItem] = useState<Save | null>(null);
  const localBookmarkItem = useRef<Save | null>(null);

  const handleClose = () => {
    setConfirmClearNote(false);
    let itemToUpdate = localBookmarkItem.current || bookmarkedItem;
    if(itemToUpdate) {
      console.log("update user saves with: ", itemToUpdate);
      updateUserSavesState('updateNote', updateUserSaves, currentBookmarkID, itemToUpdate);
      if (shouldUpdateResultsAfterBookmark)
        shouldUpdateResultsAfterBookmark.current = true;
    }

    onClose();
  }

  const handleSave = useCallback(() => {
    setShowSaved(true);
  }, []);

  const handleClearNote = async () => {
    if(!currentBookmarkID.current) {
      console.warn("No bookmarkID, unable to clear note");
      return;
    }

    // update bookmark of given ID
    let newSave: Save = await getUserSave(currentBookmarkID.current);
    newSave.notes = "";
    await updateUserSave(currentBookmarkID.current, newSave);
    localBookmarkItem.current = newSave;
    // clear text editor
    setTriggerClearEditor(true);
    handleSave();
    handleClearNotesEditor();
    setConfirmClearNote(false);
    handleClose();
  }

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
        bookmarkID={currentBookmarkID.current} 
        handleSave={handleSave}
        shouldClearEditor={triggerClearEditor}
        onClearEditorComplete={handleEditorCleared}
        setSaveItem={setBookmarkedItem}
      />
      <div className={styles.bottomButtons}>
        <Button handleClick={handleSave} className={styles.saveButton} >Save Note</Button>
        <Button handleClick={() => setConfirmClearNote(true)} className={styles.clearButton} >Clear Note</Button>
      </div>
    </Modal>
  );
}


export default NotesModal;

