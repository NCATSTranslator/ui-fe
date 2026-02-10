import { useState, useEffect } from 'react';

interface UseAnimateHeightReturn {
  height: number | 'auto';
  isOpen: boolean;
  toggle: () => void;
  setIsOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
}

interface UseAnimateHeightOptions {
  initialOpen?: boolean;
  closedHeight?: number | 'auto';
}

/**
 * Custom hook to manage AnimateHeight component state
 * 
 * @param options - Configuration options
 * @param options.initialOpen - Initial open/closed state (default: false)
 * @param options.closedHeight - Height when closed (default: 0)
 * @returns Object containing height, isOpen state, toggle function, and setIsOpen setter
 * 
 * @example
 * const { height, isOpen, toggle } = useAnimateHeight();
 * 
 * <Button onClick={toggle}>Toggle</Button>
 * <AnimateHeight height={height}>
 *   <YourContent />
 * </AnimateHeight>
 * 
 * @example
 * // With custom closed height
 * const { height, toggle } = useAnimateHeight({ closedHeight: 32 });
 */
export const useAnimateHeight = (options: UseAnimateHeightOptions = {}): UseAnimateHeightReturn => {
  const { initialOpen = false, closedHeight = 0 } = options;
  const [height, setHeight] = useState<number | 'auto'>(initialOpen ? 'auto' : closedHeight);
  const [isOpen, setIsOpen] = useState(initialOpen);

  useEffect(() => {
    if (isOpen === false) {
      setHeight(closedHeight);
    } else {
      setHeight('auto');
    }
  }, [isOpen, closedHeight]);

  const toggle = () => {
    setIsOpen(prev => !prev);
  };

  return {
    height,
    isOpen,
    toggle,
    setIsOpen,
  };
};

