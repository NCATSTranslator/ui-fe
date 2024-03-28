import {useEffect, useCallback, FC, ReactNode} from "react";
import styles from './ModalGlobals.module.scss';
import Close from '../../Icons/Buttons/Close.svg?react';

interface ModalProps {
  children?: ReactNode;
  isOpen?: boolean;
  hideCloseButton?: boolean;
  onClose?: () => void;
  className?: string;
  containerClass?: string;
  testId?: string;
}

const Modal: FC<ModalProps> = ({children, isOpen = false, onClose = () => { console.log('No onClose method specified for Modal component.') }, 
  className = "", containerClass = "", hideCloseButton = false, testId = ""}) => {

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
      document.body.style.paddingRight = '10px';
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
          <div className={styles.inner} >
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