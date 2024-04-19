import { useState, useEffect, useRef } from 'react';

export const useWindowSize = (delay = 100) => {
  // Initialize state with undefined so that we can check if it's ready during the first render
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    let timeoutId = null;

    // Handler to call on window resize
    function handleResize() {
      // Set window's width and height to state after delay
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

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      window.removeEventListener("resize", handleResize);
    };
  }, [delay]); // Re-run effect if delay changes

  return windowSize;
}

export const useGoogleAnalytics = (gaID) => {
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
export const useInterval = (callback, time) => {
  // Use useRef to persist the callback without re-creating the interval on every render
  const callbackRef = useRef(callback);

  // Update the current callback to the latest one provided,
  // without needing to clear and re-set the interval
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Function to be executed at each interval
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
 * Custom React hook that acts as a turnstile. The body of the effect is executed once when open which causes
 * the turnstile to lock. The turnstile must be unlocked externally.
 *
 * @param {turnstileIsOpen} - Predicate that returns if the turnstile is currently open.
 * @param {effectBody}    - Function called when the turnstile is open.
 * @param {turnstileLock} - Function that will lock the turnstile.
 * @param {dependencies}  - Dependencies the effect relies on.
 */
export const useTurnstileEffect = (turnstileIsOpen, effectBody, turnstileLock, dependencies) => {
  useEffect(() => {
    if (turnstileIsOpen()) {
      effectBody(...dependencies);
      turnstileLock();
    }

  }, dependencies);
}
