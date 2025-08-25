import { FC, ReactNode, useState } from "react";
import styles from "./WarningModal.module.scss";
import Modal from "@/features/Common/components/Modal/Modal";
import Button from "@/features/Core/components/Button/Button";
import StatusIndicator from "@/features/Projects/components/StatusIndicator/StatusIndicator";
import Checkbox from "@/features/Core/components/Checkbox/Checkbox";

interface WarningModalProps {
  cancelButtonText: string;
  confirmButtonText: string;
  content: string | ReactNode;
  heading: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  setStorageKeyFn?: (hide: boolean) => void;
}

const WarningModal: FC<WarningModalProps> = ({
  cancelButtonText,
  confirmButtonText,
  content,
  heading,
  isOpen,
  onCancel,
  onClose,
  onConfirm,
  setStorageKeyFn
}) => {

  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleCancel = () => {
    onCancel();
    if(dontShowAgain) {
      setStorageKeyFn?.(true);
    }
    onClose();
  }

  const handleConfirm = () => {
    onConfirm();
    if(dontShowAgain) {
      setStorageKeyFn?.(true);
    }
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={styles.warningModal} containerClass={styles.container} innerClass={styles.inner}>
      <div className={styles.header}>
        <StatusIndicator status="warning" />
        <h3 className={styles.heading}>{heading}</h3>
      </div>
      <div className={styles.content}>{content}</div>
      <div className={styles.footer}>
        <Button handleClick={handleCancel} variant="secondary" className={styles.button}>{cancelButtonText}</Button>
        <Button handleClick={handleConfirm} className={`${styles.button} ${styles.confirmButton}`}>{confirmButtonText}</Button>
      </div>
      <div className="bottom">
        <Checkbox
          label="Don't show this again"
          checked={dontShowAgain}
          handleClick={() => setDontShowAgain(prev => !prev)}
          className={styles.checkbox}
        />
      </div>
    </Modal>
  );
};

export default WarningModal;