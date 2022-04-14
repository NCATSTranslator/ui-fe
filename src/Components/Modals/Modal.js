import React from "react";
import {ReactComponent as Close} from '../../Icons/Buttons/Close.svg';

const Modal = ({children, isOpen, onClose, className}) => {

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpen = startOpen;

  return (
      <div className={`modal-window ${modalIsOpen} ${className}`}>
        <div className="modal-container">
          <div className="inner">
            {children}
          </div>
          <div className="close-container"><button className="close-button" onClick={onClose}><Close/></button></div>
        </div>
      </div>
  );
}


export default Modal;