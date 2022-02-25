import React, {useState, useEffect, useRef} from "react";
import OutsideClickHandler from "../OutsideClickHandler/OutsideClickHandler";
import {ReactComponent as Close} from '../../Icons/Buttons/Close.svg';
import { getIcon } from "../../Utilities/utilities";

const QueryItem = ({ handleClose, handleChange, item, inputKey, name, children, hasInput, isSelected}) => {

  const [inputActive, setInputActive] = useState(isSelected);
  const inputRef = useRef(null);
  const itemName = (item.value) ? item.value : name;
  
  const icon = getIcon(item.category);

  const handleClick = (!hasInput) 
    ? () => {} 
    : () => { setInputActive(true) } ;

  useEffect(()=>{
    if(inputActive) {
      inputRef.current.focus();
    }
  }, [inputActive])

  return (
    <OutsideClickHandler onOutsideClick={()=>setInputActive(false) } className={`query-item ${inputActive}`}>
      {icon}
      <span onClick={handleClick} >
        {hasInput &&
          <input type="text" className="input" ref={inputRef} onChange={handleChange} data-inputkey={inputKey} />
        }
        <div className="query-item-container"><p>{itemName}</p></div>
        {children}
      </span>
      <div onClick={handleClose} className="remove"><Close/></div>
    </OutsideClickHandler>
  );
}

export default QueryItem;