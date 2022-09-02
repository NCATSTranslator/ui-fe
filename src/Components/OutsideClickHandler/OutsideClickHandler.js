import React, {useRef, useState, useEffect, useCallback} from "react";

const OutsideClickHandler = ({children, onOutsideClick, className}) => {

  const wrapperRef = useRef(null);
  const [listenerAdded, setListenerAdded] = useState(false);

  const handleClickOutside = useCallback((e) => {
    if (
      wrapperRef.current &&
      !wrapperRef.current.contains(e.target)
    ) {
      onOutsideClick();
    } else {
    }
  }, [onOutsideClick])

  useEffect(() => {
    if(!listenerAdded) {
      document.addEventListener('click', handleClickOutside);
      setListenerAdded(true);
    } 
  }, [handleClickOutside, listenerAdded])

  return(
    <div ref={wrapperRef} className={className}>
      {children}
    </div>
  )
}

export default OutsideClickHandler;