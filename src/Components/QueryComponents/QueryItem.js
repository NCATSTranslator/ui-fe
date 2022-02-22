import React, {useState, useEffect, useRef} from "react";

import {ReactComponent as Close} from '../../Icons/Buttons/Close.svg';

const QueryItem = ({handleClick, handleClose, handleChange, item, inputKey, name, children, hasInput}) => {

  const [inputActive, setInputActive] = useState(false);
  const inputRef = useRef(null);

  handleClick = (!hasInput) 
    ? () => {} 
    : () => { setInputActive(true) } ;

    useEffect(()=>{
      if(inputActive) {
        inputRef.current.focus();
      }
    })

  return (
    <span onClick={handleClick} className={`query-item ${inputActive}`}>
      {hasInput &&
        <input type="text" className="input" ref={inputRef} onChange={handleChange} data-inputkey={inputKey} />
      }
      <div className="query-item-container"><p>{name}</p></div>
      <div onClick={handleClose} className="remove"><Close/></div>
      {children}
    </span>
  );
}

export default QueryItem;