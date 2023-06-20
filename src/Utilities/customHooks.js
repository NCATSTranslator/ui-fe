import { useState, useEffect } from 'react';

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