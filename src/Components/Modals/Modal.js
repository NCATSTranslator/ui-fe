import React from "react";
import {ReactComponent as Close} from '../../Icons/Buttons/Close.svg';

const Modal = ({children, isOpen, onClose, className, containerClass, hideCloseButton}) => {

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpen = startOpen;

  return (
      <div className={`modal-window ${modalIsOpen} ${className}`}>
        <div className={`modal-container ${containerClass}`}>
          <div className="inner">
            {children}
          </div>
          {
            !hideCloseButton && 
            <div className="close-container"><button className="close-button" onClick={onClose}><Close/></button></div>
          }
        </div>
      </div>
  );
}


export default Modal;