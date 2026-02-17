import { useState, useEffect } from 'react';

export interface UseZoomKeyReturn {
  zoomKeyDown: boolean;
}

const useZoomKey = (): UseZoomKeyReturn => {
  const [zoomKeyDown, setZoomKeyDown] = useState(false);

  useEffect(() => {
    const isTypingInInput = (ev: KeyboardEvent): boolean => {
      const target = ev.target as HTMLElement;
      return target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
    };

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "z" && !isTypingInInput(ev)) {
        setZoomKeyDown(true);
      }
    };

    const handleKeyUp = (ev: KeyboardEvent) => {
      if (ev.key === "z") {
        setZoomKeyDown(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return { zoomKeyDown };
};

export default useZoomKey;
