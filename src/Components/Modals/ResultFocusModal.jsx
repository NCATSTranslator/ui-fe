import Modal from './Modal';
import styles from './ResultFocusModal.module.scss';
import Button from '../FormFields/Button';
import { formatBiolinkNode, truncateStringIfTooLong } from '../../Utilities/utilities';

const ResultFocusModal = ({isOpen, onAccept, onReject, sharedItem}) => {

  const name = truncateStringIfTooLong(formatBiolinkNode(sharedItem.name, sharedItem.type));

  return (
    <Modal isOpen={isOpen} onClose={onReject} hideCloseButton={true}>
      <div className={styles.content}>
        <h4 className={styles.heading}>Shared Link Loaded</h4>
        <p>The link that just loaded is meant to share the following result:<span className={`${styles.sharedItem}`}> {name}</span>. Do you want to jump to it?</p>
      </div>
      <div className={styles.buttonsContainer}>
        <Button handleClick={onReject} className={styles.button} isSecondary>Do not jump to the result</Button>
        <Button handleClick={onAccept} className={styles.button}>Jump to the result</Button>
      </div>
    </Modal>
  );
}

export default ResultFocusModal;
