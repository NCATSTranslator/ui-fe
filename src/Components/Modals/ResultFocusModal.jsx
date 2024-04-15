import Modal from './Modal';
import styles from './ResultFocusModal.module.scss';
import Button from '../FormFields/Button';

const ResultFocusModal = ({isOpen, onAccept, onReject, sharedItem}) => {
  return (
    <Modal isOpen={isOpen} onClose={onReject} hideCloseButton={true}>
      <div className={styles.content}>
        <h4 className={styles.heading}>The link that is loading is meant to share the result {sharedItem.name}. Would you want to jump to it?</h4>
      </div>
      <div className={styles.buttonsContainer}>
        <Button handleClick={onReject} className={styles.button} isSecondary>Do not jump to the result</Button>
        <Button handleClick={onAccept} className={styles.button}>Jump to the result</Button>
      </div>
    </Modal>
  );
}

export default ResultFocusModal;
