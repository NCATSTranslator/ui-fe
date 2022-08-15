import React, {useState, useEffect, useRef} from "react";
import styles from './QueryItem.module.scss'
import OutsideClickHandler from "../OutsideClickHandler/OutsideClickHandler";
import {ReactComponent as Close} from '../../Icons/Buttons/Close.svg';
import { getIcon } from "../../Utilities/utilities";

const QueryItem = ({ handleClose, handleChange, item, inputKey, name, children, hasInput, isSelected}) => {

  const [inputActive, setInputActive] = useState(isSelected);
  const inputActiveClass = (inputActive) ? styles.true : styles.false;
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
    <OutsideClickHandler onOutsideClick={()=>setInputActive(false) } className={`${styles.queryItem} ${inputActiveClass}`}>
      {icon}
      <span onClick={handleClick} >
        {hasInput &&
          <input type="text" className={styles.input} ref={inputRef} onChange={handleChange} data-inputkey={inputKey} />
        }
        <div className={styles.queryItemContainer}><p>{itemName}</p></div>
        {children}
      </span>
      <div onClick={handleClose} className={styles.remove}><Close/></div>
    </OutsideClickHandler>
  );
}

export default QueryItem;