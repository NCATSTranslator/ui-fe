import {useRef, useState, useEffect, useCallback, FC, ReactNode} from "react";

interface OutsideClickHandlerProps {
  children: ReactNode;
  className?: string;
  onOutsideClick: () => void;
}

const OutsideClickHandler: FC<OutsideClickHandlerProps> = ({
  children,
  className = "",
  onOutsideClick }) => {

    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const [listenerAdded, setListenerAdded] = useState(false);

  const handleClickOutside = useCallback((e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        onOutsideClick();
    },
    [onOutsideClick]
  );

  useEffect(() => {
    if (!listenerAdded) {
      document.addEventListener("click", handleClickOutside);
      setListenerAdded(true);
    }

    return () => document.removeEventListener("click", handleClickOutside);
  }, [handleClickOutside, listenerAdded]);

  return(
    <div ref={wrapperRef} className={className}>
      {children}
    </div>
  )
}

export default OutsideClickHandler;