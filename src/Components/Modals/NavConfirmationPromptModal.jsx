import { useEffect, useState } from "react";
import styles from './NavConfirmationPromptModal.module.scss';
import Modal from "./Modal";
import Button from '../Core/Button';

const NavConfirmationModal = ({blocker}) => {

  const initActive = (blocker.state === 'blocked') ? true : false;
  const [modalIsOpen, setModalIsOpen] = useState(initActive);

  useEffect(() => {
    if(blocker.state === 'blocked')
      setModalIsOpen(true);
    else
      setModalIsOpen(false);
  }, [blocker.state]);

  const handleClose = () => {
    blocker.reset?.();
    setModalIsOpen(false);
  }

  return (
    <Modal
      isOpen={modalIsOpen} 
      onClose={handleClose} 
      testId="navconf-modal"
      hideCloseButton
      >
      <div className={styles.content}>        
        <h4 className={styles.heading}>Are you sure you want to leave this page?</h4>
        <p className={styles.text}>
          If you leave this page, you may lose your results and have to run this query again.
        </p>
        <p className={styles.subtitle}>Note: You can revisit this query later by visiting the Search History page.</p>
      </div>
      <div className={styles.buttonsContainer}>
        <Button handleClick={() => blocker.proceed?.()} className={styles.button} isSecondary>Navigate away from the results page</Button>
        <Button handleClick={() => blocker.reset?.()} className={styles.button}>Stay on the results page</Button>
      </div>
    </Modal>
  )
}

export default NavConfirmationModal;