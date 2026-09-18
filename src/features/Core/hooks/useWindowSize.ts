import { useState, useEffect } from 'react';
import { Timeout } from '@/features/Core/types/global';

interface WindowSize {
  width: number | undefined;
  height: number | undefined;
}

export const useWindowSize = (delay: number = 100): WindowSize => {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    let timeoutId: Timeout | null = null;

    function handleResize() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, delay);
    }

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      window.removeEventListener("resize", handleResize);
    };
  }, [delay]);

  return windowSize;
};
