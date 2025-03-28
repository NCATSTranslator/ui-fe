import { useRef, useEffect, FC, ReactNode } from "react";

interface OutsideClickHandlerProps {
  children: ReactNode;
  className?: string;
  onOutsideClick: () => void;
}

const OutsideClickHandler: FC<OutsideClickHandlerProps> = ({
  children,
  className = "",
  onOutsideClick
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        onOutsideClick();
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [onOutsideClick]);

  return (
    <div ref={wrapperRef} className={className}>
      {children}
    </div>
  );
};

export default OutsideClickHandler;
