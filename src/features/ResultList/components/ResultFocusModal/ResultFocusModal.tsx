import Modal from '@/features/Common/components/Modal/Modal';
import styles from './ResultFocusModal.module.scss';
import Button from '@/features/Core/components/Button/Button';
import { truncateStringIfTooLong, getFormattedPathfinderName } from '@/features/Common/utils/utilities';
import { FC } from 'react';

interface ResultFocusModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
  sharedItem: {
    name: string;
  };
  queryType: string;
}

const ResultFocusModal: FC<ResultFocusModalProps> = ({
  isOpen,
  onAccept,
  onReject,
  sharedItem,
  queryType
  }) => {
  const name = truncateStringIfTooLong(
    queryType === 'p'
      ? getFormattedPathfinderName(sharedItem.name.replaceAll('/', ' - '))
      : sharedItem.name
  );

  return (
    <Modal isOpen={isOpen} onClose={onReject} hideCloseButton={true}>
      <div className={styles.content}>
        <h4 className={styles.heading}>Shared Link Loaded</h4>
        <p>
          The link that just loaded is meant to share the following result:
          <span className={styles.sharedItem}> {name}</span>. Do you want to jump to it?
        </p>
      </div>
      <div className={styles.buttonsContainer}>
        <Button handleClick={onReject} className={styles.button} variant="secondary">
          Do not jump to the result
        </Button>
        <Button handleClick={onAccept} className={styles.button}>
          Jump to the result
        </Button>
      </div>
    </Modal>
  );
};

export default ResultFocusModal;
