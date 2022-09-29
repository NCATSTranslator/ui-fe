import React, {useEffect} from "react";
import styles from './ModalGlobals.module.scss';
import {ReactComponent as Close} from '../../Icons/Buttons/Close.svg';

const Modal = ({children, isOpen, onClose, className, containerClass, hideCloseButton, testId}) => {

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpen = (startOpen) ? styles.true : styles.false;

  const handleKeypress = (e) => {
    if(e.key === 'Escape') {
      onClose();
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeypress);

    return () => {
      window.removeEventListener("keydown", handleKeypress);
    };
  }, []);

  return (
    <div className={`${styles.modalWindow} ${modalIsOpen} ${className}`} data-testid={testId}>
      <div className={`${styles.modalContainer} ${containerClass}`}>
        <div className={styles.inner}>
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