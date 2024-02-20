import { useState, useEffect, useCallback } from "react";
import styles from "./NotesModal.module.scss";
import Modal from "./Modal";
import TextEditor from "../TextEditor/TextEditor";
import Button from "../FormFields/Button";
import { getUserSave, updateUserSave } from "../../Utilities/userApi";

const NotesModal = ({isOpen, onClose, noteLabel, bookmarkID = null , handleClearNotesEditor = ()=>{}}) => {

  const startOpen = (isOpen === undefined) ? false : isOpen;
  const [showSaved, setShowSaved] = useState(false);
  const [triggerClearEditor, setTriggerClearEditor] = useState(false);
  const [confirmClearNote, setConfirmClearNote] = useState(false);

  const handleClose = () => {
    setConfirmClearNote(false);
    onClose();
  }

  const handleSave = useCallback(() => {
    setShowSaved(true);
  }, []);

  const handleClearNote = async () => {
    if(!bookmarkID) {
      console.warn("No bookmarkID, unable to clear note");
      return;
    }

    console.log("Clear notes from: ", bookmarkID);
    // update bookmark of given ID
    let newSave = await getUserSave(bookmarkID);
    newSave.notes = "";
    await updateUserSave(bookmarkID, newSave);
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
            <p className="bold ">This is permanent, and cannot be undone.</p>
            <div className={styles.buttons}>
              <Button handleClick={() => setConfirmClearNote(false)} className={styles.button} isSecondary>Keep Note</Button>
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
        bookmarkID={bookmarkID} 
        handleSave={handleSave}
        shouldClearEditor={triggerClearEditor}
        onClearEditorComplete={handleEditorCleared}
      />
      <div className={styles.bottomButtons}>
        <button onClick={handleSave} className={styles.saveButton} >Save Note</button>
        <button onClick={() => setConfirmClearNote(true)} className={styles.clearButton} >Clear Note</button>
      </div>
    </Modal>
  );
}


export default NotesModal;

