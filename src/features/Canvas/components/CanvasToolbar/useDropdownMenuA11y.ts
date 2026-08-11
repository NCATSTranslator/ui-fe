import { KeyboardEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

const getFocusableMenuItems = (menu: HTMLElement): HTMLElement[] =>
  Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)'));

const useDropdownMenuA11y = () => {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  const openMenu = useCallback(() => setOpen(true), []);
  const toggle = useCallback(() => setOpen(prev => !prev), []);

  useEffect(() => {
    if (!open) return;
    const items = menuRef.current ? getFocusableMenuItems(menuRef.current) : [];
    items[0]?.focus();
  }, [open]);

  const handleTriggerKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault();
        close();
      }
      return;
    }
    if ((event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') && !open) {
      event.preventDefault();
      openMenu();
    }
  }, [close, open, openMenu]);

  const handleMenuKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      triggerRef.current?.focus();
      return;
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    const items = getFocusableMenuItems(event.currentTarget);
    if (items.length === 0) return;

    event.preventDefault();
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    const nextIndex = event.key === 'ArrowDown'
      ? (currentIndex + 1) % items.length
      : (currentIndex <= 0 ? items.length - 1 : currentIndex - 1);

    items[nextIndex]?.focus();
  }, [close]);

  const triggerA11yProps = useMemo(() => ({
    'aria-expanded': open,
    'aria-haspopup': 'menu' as const,
    'aria-controls': open ? menuId : undefined,
    onKeyDown: handleTriggerKeyDown,
  }), [open, menuId, handleTriggerKeyDown]);

  const menuA11yProps = useMemo(() => ({
    id: menuId,
    role: 'menu' as const,
    onKeyDown: handleMenuKeyDown,
  }), [menuId, handleMenuKeyDown]);

  return {
    open,
    setOpen,
    close,
    toggle,
    menuId,
    triggerRef,
    menuRef,
    triggerA11yProps,
    menuA11yProps,
  };
};

export default useDropdownMenuA11y;
