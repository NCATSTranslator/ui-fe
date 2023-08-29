import { useState, useEffect, useCallback } from "react";
import styles from "./NotesModal.module.scss";
import Modal from "./Modal";
import TextEditor from "../TextEditor/TextEditor";
import { getUserSave, updateUserSave } from "../../Utilities/userApi";

const NotesModal = ({isOpen, onClose, noteLabel, bookmarkID = null , handleClearNotesEditor = ()=>{}}) => {

  const startOpen = (isOpen === undefined) ? false : isOpen;
  const [showSaved, setShowSaved] = useState(false);
  const [triggerClearEditor, setTriggerClearEditor] = useState(false);

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
      onClose={onClose} 
      className={styles.notesModal}
      containerClass={styles.notesContainer}
      >
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
          <button onClick={handleClearNote} className={styles.button} >Clear Note</button>
        </div>
      <TextEditor 
        bookmarkID={bookmarkID} 
        handleSave={handleSave}
        shouldClearEditor={triggerClearEditor}
        onClearEditorComplete={handleEditorCleared}
      />
    </Modal>
  );
}


export default NotesModal;

