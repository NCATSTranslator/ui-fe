import React, {useRef, useEffect} from "react";

const OutsideClickHandler = ({children, onOutsideClick, className}) => {

  const wrapperRef = useRef(null);

  const handleClickOutside = (e) => {
    if (
      wrapperRef.current &&
      !wrapperRef.current.contains(e.target)
    ) {
      onOutsideClick();
    }
  }
  useEffect(() => {
    document
      .addEventListener('mousedown', handleClickOutside);
  }, [])

  return(
    <div ref={wrapperRef} className={className}>
      {children}
    </div>
  )
}

export default OutsideClickHandler;