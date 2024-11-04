import { FC } from "react";
import styles from "./NotesModal.module.scss";
import Modal from "./Modal";

interface ResultsSummaryModalProps {
  isOpen?: boolean;
  isSummaryAvailable: boolean;
  isSummaryLoading: boolean;
  onClose?: Function;
}

const ResultsSummaryModal: FC<ResultsSummaryModalProps> = ({isOpen = false, isSummaryAvailable, isSummaryLoading, onClose = ()=>{}}) => {

  const startOpen = (isOpen === undefined) ? false : isOpen;

  const handleClose = () => {
    onClose();
  }

  return (
    <Modal 
      isOpen={startOpen} 
      onClose={handleClose} 
      className={styles.notesModal}
      containerClass={styles.notesContainer}
      >
        
    </Modal>
  );
}


export default ResultsSummaryModal;

