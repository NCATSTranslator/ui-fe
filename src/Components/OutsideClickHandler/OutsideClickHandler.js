import React, {useRef, useEffect, useCallback} from "react";

const OutsideClickHandler = ({children, onOutsideClick, className}) => {

  const wrapperRef = useRef(null);

  const handleClickOutside = useCallback((e) => {
    if (
      wrapperRef.current &&
      !wrapperRef.current.contains(e.target)
    ) {
      onOutsideClick();
    }
  }, [onOutsideClick])
  useEffect(() => {
    document
      .addEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside])

  return(
    <div ref={wrapperRef} className={className}>
      {children}
    </div>
  )
}

export default OutsideClickHandler;