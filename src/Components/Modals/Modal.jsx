import {useEffect, useCallback} from "react";
import styles from './ModalGlobals.module.scss';
import Close from '../../Icons/Buttons/Close.svg?react';

const Modal = ({children, isOpen, onClose, className, containerClass, hideCloseButton, testId}) => {

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpenClass = (startOpen) ? styles.true : styles.false;
  onClose = (onClose) ? onClose : ()=>{console.log('no onClose method specified for Modal component.')};

  const handleKeypress = useCallback((e) => {
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
            <div className={styles.closeContainer}><button className={styles.closeButton} onClick={onClose}><Close/></button></div>
          }
      </div>
    </div>
  );
}


export default Modal;