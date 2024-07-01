import { useState, useEffect, useRef, useContext, Dispatch, SetStateAction } from 'react';
import { LastViewedPathIDContext } from '../Components/PathView/PathView';
import { isEqual } from 'lodash';

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
    let timeoutId: NodeJS.Timeout | null = null;

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
}

export const useGoogleAnalytics = (gaID: string | undefined): void => {
  useEffect(() => {
    if (!gaID) return;

    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaID}`;

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaID}');
    `;

    document.head.appendChild(script1);
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, [gaID]);
};

/**
 * Custom React hook that executes a callback function at specified time intervals.
 *
 * @param {number} time - The interval time in milliseconds.
 * @param {Function} callback - The callback function to be executed.
 */
export const useInterval = (callback: () => void, time: number | null): void => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => {
      callbackRef.current();
    };

    if (time !== null) {
      const id = setInterval(tick, time);
      return () => clearInterval(id);
    }
  }, [time]);
};

/**
 * Custom React hook that controls the execution of effects based on a gatekeeper function.
 * It runs the effect only once when `checkOpen` returns true and then locks further executions until reset.
 *
 * @param checkOpen - Function that returns true to allow the effect to run.
 * @param effectBody - The effect to execute when conditions are met.
 * @param lockTurnstile - Function to lock the turnstile, preventing further executions.
 *
 * This hook manages controlled execution cycles by using internal state to monitor and block repeat executions,
 * ensuring effects are only run under the appropriate conditions as dictated by `checkOpen`.
 */
export const useTurnstileEffect = ( checkOpen: () => boolean, effectBody: () => void, lockTurnstile: () => void): void => {
    const [turnstileOpen, setTurnstileOpen] = useState(false);

    // Handle the effect logic internally
    useEffect(() => {
        if (checkOpen() && !turnstileOpen) {
            setTurnstileOpen(true);
            effectBody();
        }
    }, [checkOpen, turnstileOpen, effectBody]);

    // Lock the turnstile after running effect
    useEffect(() => {
        if (turnstileOpen) {
            lockTurnstile();
            setTurnstileOpen(false); // Reset the turnstile state
        }
    }, [turnstileOpen, lockTurnstile]);
}

// Helper function to perform a deep comparison and log differences
const logDeepDifferences = (obj1: any, obj2: any, name: string, path: string = '') => {
  const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
  let changes: any = [];

  keys.forEach(key => {
      const newPath = path ? `${path}.${key}` : key;
      const value1 = obj1[key];
      const value2 = obj2[key];

      if (typeof value1 === 'object' && value1 != null && typeof value2 === 'object' && value2 != null) {
          changes = changes.concat(logDeepDifferences(value1, value2, name, newPath));
      } else if (!isEqual(value1, value2)) {
          changes.push({ path: newPath, from: value1, to: value2 });
      }
  });

  return changes;
};

export const useWhyDidComponentUpdate = <T extends Record<string, any>>(name: string, props: T) => {
  const previousProps = useRef<T | undefined>(undefined);

  useEffect(() => {
      if (previousProps.current !== undefined) {
          const changes = logDeepDifferences(previousProps.current, props, name);

          if (changes.length > 0) {
              console.log(`Why did ${name} update:`, changes);
          }
      }

      previousProps.current = props;
  }, [props, name]); 
}

export type LastViewedPathIDContextType = {
  lastViewedPathID: string | null;
  setLastViewedPathID: Dispatch<SetStateAction<string | null>>;
};
export const useLastViewedPath = () => {
  const context = useContext(LastViewedPathIDContext);
  if (!context) {
    throw new Error('useLastViewedPath must be used within a LastViewedPathProvider');
  }
  return context;
};