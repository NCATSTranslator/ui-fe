import { useEffect, useState, useCallback, FC, KeyboardEvent } from "react";
import styles from './NavConfirmationPromptModal.module.scss';
import Modal from '@/features/Common/components/Modal/Modal';
import Button from '@/features/Core/components/Button/Button';
import { Blocker } from "@/features/Common/types/global";

export interface NavConfirmationPromptModalProps {
  blocker: Blocker;
  title?: string;
  message?: string;
  subtitle?: string;
  proceedButtonText?: string;
  stayButtonText?: string;
  className?: string;
  onProceed?: () => void;
  onStay?: () => void;
  testId?: string;
}

const NavConfirmationPromptModal: FC<NavConfirmationPromptModalProps> = ({
  blocker,
  title = "Are you sure you want to leave this page?",
  message = "If you leave this page, you may lose your results and have to run this query again.",
  subtitle = "Note: You can revisit this query later by visiting the Search History page.",
  proceedButtonText = "Navigate away from the results page",
  stayButtonText = "Stay on the results page",
  className,
  onProceed,
  onStay,
  testId = "navconf-modal"
}) => {
  const [modalIsOpen, setModalIsOpen] = useState(blocker.state === 'blocked');

  // Handle blocker state changes
  useEffect(() => {
    setModalIsOpen(blocker.state === 'blocked');
  }, [blocker.state]);

  // Handle proceeding (navigating away)
  const handleProceed = useCallback(() => {
    onProceed?.();
    blocker.proceed?.();
    setModalIsOpen(false);
  }, [blocker, onProceed]);

  // Handle staying on the page
  const handleStay = useCallback(() => {
    onStay?.();
    blocker.reset?.();
    setModalIsOpen(false);
  }, [blocker, onStay]);

  // Handle modal close (same as staying)
  const handleClose = useCallback(() => {
    handleStay();
  }, [handleStay]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleStay();
    } else if (event.key === 'Enter') {
      handleProceed();
    }
  }, [handleStay, handleProceed]);

  return (
    <Modal
      isOpen={modalIsOpen}
      onClose={handleClose}
      testId={testId}
      hideCloseButton
      className={className}
    >
      <div 
        className={styles.content}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="dialog"
        aria-labelledby="nav-confirmation-title"
        aria-describedby="nav-confirmation-message"
      >
        <h4 
          id="nav-confirmation-title"
          className={styles.heading}
        >
          {title}
        </h4>
        <p 
          id="nav-confirmation-message"
          className={styles.text}
        >
          {message}
        </p>
        {subtitle && (
          <p className={styles.subtitle}>
            {subtitle}
          </p>
        )}
      </div>
      <div className={styles.buttonsContainer}>
        <Button 
          handleClick={handleProceed}
          className={styles.button}
          variant="secondary"
          testId="nav-confirmation-proceed-button"
        >
          {proceedButtonText}
        </Button>
        <Button 
          handleClick={handleStay}
          className={styles.button}
          testId="nav-confirmation-stay-button"
        >
          {stayButtonText}
        </Button>
      </div>
    </Modal>
  );
};

export default NavConfirmationPromptModal; 