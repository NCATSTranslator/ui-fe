import { useRef, useEffect, ReactNode, KeyboardEvent, forwardRef } from "react";

interface OutsideClickHandlerProps {
  children: ReactNode;
  className?: string;
  onOutsideClick: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  tabIndex?: number;
}

const OutsideClickHandler = forwardRef<HTMLDivElement, OutsideClickHandlerProps>(({
  children,
  className = "",
  onOutsideClick,
  onKeyDown,
  tabIndex
}, ref) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Use the forwarded ref or fall back to internal ref
  const finalRef = ref || wrapperRef;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (finalRef && typeof finalRef === 'object' && finalRef.current && !finalRef.current.contains(e.target as Node))
        onOutsideClick();
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [onOutsideClick, finalRef]);

  return (
    <div 
      ref={finalRef} 
      className={className} 
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
    >
      {children}
    </div>
  );
});

OutsideClickHandler.displayName = 'OutsideClickHandler';

export default OutsideClickHandler;
