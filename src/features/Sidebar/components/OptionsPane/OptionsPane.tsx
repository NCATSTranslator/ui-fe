import { FC, ReactNode, MouseEvent as ReactMouseEvent, RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./OptionsPane.module.scss";
import { joinClasses } from "@/features/Core/utils/classHelpers";

const GAP_PX = 2;

interface OptionsPaneProps {
  children: ReactNode;
  className?: string;
  onOptionItemClick?: (e: ReactMouseEvent<HTMLDivElement>) => void;
  open?: boolean;
  /** Element the menu should anchor to (typically the options trigger wrapper). */
  anchorRef: RefObject<HTMLElement | null>;
  /** Called on outside click, Escape, or scroll. */
  onClose?: () => void;
}

interface MenuPosition {
  top: number;
  left: number;
}

const OptionsPane: FC<OptionsPaneProps> = ({
  children,
  className,
  open,
  onOptionItemClick,
  anchorRef,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const anchor = anchorRef.current;
      const menu = menuRef.current;
      if (!anchor || !menu) return;

      const anchorRect = anchor.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const spaceBelow = window.innerHeight - anchorRect.bottom;
      const spaceAbove = anchorRect.top;
      const openUpward = spaceBelow < menuRect.height + GAP_PX && spaceAbove > spaceBelow;

      const top = openUpward
        ? Math.max(GAP_PX, anchorRect.top - menuRect.height - GAP_PX)
        : anchorRect.bottom + GAP_PX;
      // Right-align to the anchor, matching previous absolute `right: -1px` behavior
      const left = Math.max(GAP_PX, anchorRect.right - menuRect.width);

      setPosition({ top, left });
    };

    updatePosition();
  }, [open, children, anchorRef]);

  useEffect(() => {
    if (!open || !onClose) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleScrollOrResize = () => onClose();

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !children) return null;

  const optionsPaneClass = joinClasses(styles.optionsPane, className);

  return createPortal(
    <div
      ref={menuRef}
      className={optionsPaneClass}
      onClick={onOptionItemClick}
      // eslint-disable-next-line no-restricted-syntax -- menu position is computed from the anchor at runtime
      style={position ? { top: position.top, left: position.left } : { visibility: "hidden" }}
    >
      {children}
    </div>,
    document.body,
  );
};

export default OptionsPane;
