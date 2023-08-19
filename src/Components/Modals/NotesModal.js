import styles from "./NotesModal.module.scss";
import Modal from "./Modal";
import TextEditor from "../TextEditor/TextEditor";

const NotesModal = ({isOpen, onClose, noteLabel, bookmarkID = null}) => {

  const startOpen = (isOpen === undefined) ? false : isOpen;
  let modalIsOpen = startOpen;

  return (
    <Modal 
      isOpen={modalIsOpen} 
      onClose={onClose} 
      className={styles.notesModal}
      containerClass={styles.notesContainer}
      >
        {
          noteLabel 
          ? <h5 className={styles.heading}>Showing Notes for: <span className={styles.item}>{noteLabel}</span></h5>
          : <h5 className={styles.heading}>Notes:</h5>
        }
      <TextEditor bookmarkID={bookmarkID}/>
    </Modal>
  );
}


export default NotesModal;

