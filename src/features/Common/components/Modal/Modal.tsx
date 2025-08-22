import {useEffect, useCallback, FC, ReactNode} from "react";
import styles from './ModalGlobals.module.scss';
import Close from '@/assets/icons/buttons/Close/Close.svg?react';

interface ModalProps {
  children?: ReactNode;
  className?: string;
  containerClass?: string;
  hideCloseButton?: boolean;
  innerClass?: string;
  isOpen: boolean;
  onClose?: () => void;
  testId?: string;
}

const Modal: FC<ModalProps> = ({
  children,
  className = "",
  containerClass = "",
  hideCloseButton = false,
  innerClass = "",
  isOpen = false,
  onClose = () => { console.log('No onClose method specified for Modal component.') }, 
  testId = ""
}) => {

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpenClass = (startOpen) ? styles.true : styles.false;

  const handleKeypress = useCallback((e: KeyboardEvent) => {
    if(e.key === 'Escape') {
      onClose();
    }
  },[onClose]);

  const handleClickOutside = () => {
    if(isOpen)
      onClose();
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeypress);

    return () => {
      window.removeEventListener("keydown", handleKeypress);
    };
  }, [handleKeypress]);

  useEffect(() => {
    if(startOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0';
    } 
    return () => {
      document.body.style.overflow = 'auto';
    }
  }, [startOpen]);

  return (
    <div className={`${styles.modalWindow} ${modalIsOpenClass} ${className}`} data-testid={testId} onClick={handleClickOutside}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`${styles.modalContainer} ${containerClass}`}
        >
          <div className={`${styles.inner} ${innerClass}`}>
            {children}
          </div>
          {
            !hideCloseButton && 
            <div className={styles.closeContainer} data-test-id="modal-close-button">
              <button className={styles.closeButton} onClick={onClose}><Close/></button>
            </div>
          }
      </div>
    </div>
  );
}


export default Modal;