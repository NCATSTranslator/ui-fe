import React, {useEffect, useCallback} from "react";
import styles from './ModalGlobals.module.scss';
import {ReactComponent as Close} from '../../Icons/Buttons/Close.svg';

const Modal = ({children, isOpen, onClose, className, containerClass, hideCloseButton, testId}) => {

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpen = (startOpen) ? styles.true : styles.false;
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

  return (
    <div className={`${styles.modalWindow} ${modalIsOpen} ${className}`} data-testid={testId} onClick={handleClickOutside}>
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