import { useEffect, useState, FC } from "react";
import styles from './BookmarkConfirmationModal.module.scss';
import Modal from "./Modal";
import Button from '../FormFields/Button';

interface BookmarkConfirmationModalProps {
  onClose?: () => void;
  onApprove?: () => void;
  isOpen?: boolean;
}

const BookmarkConfirmationModal: FC<BookmarkConfirmationModalProps> = ({ onClose = ()=>{}, onApprove = ()=>{}, isOpen = false }) => {

  const [fadeClass, setFadeClass] = useState<boolean>(false);

  const handleClick = () => {
    onApprove();
    onClose();
  }

  useEffect(() => {
    if(!fadeClass) {
      const timer = setTimeout(() => {
        setFadeClass(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  },[fadeClass]);

  return (
    <Modal
      isOpen={isOpen} 
      onClose={onClose} 
      testId="bookmarkconf-modal"
      hideCloseButton
      >
      <div className={styles.content}>        
        <h5>Are you sure you want to remove this bookmark?</h5>
        <p className={`bold`}>
          Once a bookmark is removed it cannot be restored and any notes associated with it will also be removed.
        </p>
      </div>
      <div className={styles.buttonsContainer}>
        <Button handleClick={onClose} className={styles.button} isSecondary>Keep Bookmark</Button>
        <Button handleClick={handleClick} className={styles.button}>Remove Bookmark</Button>
      </div>
    </Modal>
  )
}

export default BookmarkConfirmationModal;