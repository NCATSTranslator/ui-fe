import { useState, useEffect, useRef, useContext, Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { LastViewedPathIDContext, SupportPathDepthContext } from '../Components/PathView/PathView';
import { SupportPathKeyContext } from '../Components/SupportPathGroup/SupportPathGroup';
import { isEqual } from 'lodash';
import { useQuery } from 'react-query';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../Redux/store';
import { markEdgeSeen, markEdgeUnseen, resetSeenStatus } from '../Redux/slices/seenStatusSlice';


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

const GA_ID_REGEX = /^G-[A-Z0-9]{10}$/;
const isValidGAID = (gaID: string): boolean => {
  return GA_ID_REGEX.test(gaID);
};
export const useGoogleAnalytics = (gaID: string | undefined): void => {
  useEffect(() => {
    if (!gaID || !isValidGAID(gaID)) return;

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

const GTM_ID_REGEX = /^GTM-\w+$/;
const isValidGTMID = (gtmID: string): boolean => {
  return GTM_ID_REGEX.test(gtmID);
};
export const useGoogleTagManager = (gtmID: string | undefined): void => {
  useEffect(() => {
    if (!gtmID || !isValidGTMID(gtmID)) return;

    const headScript = document.createElement('script');
    headScript.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmID}');
    `;

    const noscript = document.createElement('noscript');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmID}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    noscript.appendChild(iframe);

    document.head.appendChild(headScript);

    document.body.insertAdjacentElement('afterbegin', noscript);

    return () => {
      document.head.removeChild(headScript);
      document.body.removeChild(noscript);
    };
  }, [gtmID]);
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
export const useLastViewedPath = (): LastViewedPathIDContextType => {
  const context = useContext(LastViewedPathIDContext);
  if (!context) {
    console.warn("useLastViewedPath must be used within a LastViewedPathIDContext.Provider");
    return { lastViewedPathID: null, setLastViewedPathID: () => {} };
  }
  return context;
};

interface TextStreamHookResult {
  streamedText: string;
  isStreaming: boolean;
  isError: boolean;
  startStream: () => Promise<void>;
  cancelStream: () => void;
}

export const useTextStream = (
  endpoint: string,
  queryString: string,
  resultContext: React.RefObject<any>,
  onComplete?: Function,
  onCancel?: Function
): TextStreamHookResult => {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const hasBeenCanceled = useRef<boolean>(false);

  const fetchTextStream = async (signal: AbortSignal) => {
    console.log("Fetching new summary...");
    const requestJson = JSON.stringify({
      query: queryString,
      results: resultContext.current
    });

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestJson,
      signal // abort signal 
    };

    try {
      const response = await fetch(endpoint, requestOptions);
      if (!response.ok) 
        throw new Error(`HTTP error! status: ${response.status}`);
      if (!response.body) 
        throw new Error('No response body received');

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder('utf-8');
      let result = '';

      while (true) {
        try {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          result += chunk;
          setStreamedText((prev) => prev + chunk);
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') 
            break;
          throw error;
        }
      }

      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Stream cancelled');
        return null;
      }
      throw error;
    } finally {
      readerRef.current = null;
    }
  };

  const { isError, refetch } = useQuery(
    'textStream',
    () => {
      abortControllerRef.current = new AbortController();
      return fetchTextStream(abortControllerRef.current.signal);
    },
    {
      enabled: false,
      refetchOnWindowFocus: false,
      retry: 3,
      onSuccess: (data) => {
        setIsStreaming(false);
        if (!!onComplete && data !== null && !hasBeenCanceled.current) 
          onComplete();
        hasBeenCanceled.current = false;
      },
      onError: (error) => {
        setIsStreaming(false);
        if (!(error instanceof Error && error.name === 'AbortError')) {
          console.error('Stream error:', error);
        }
      }
    }
  );

  const startStream = async () => {
    setStreamedText('');
    setIsStreaming(true);
    hasBeenCanceled.current = false;
    await refetch();
  };

  const cancelStream = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    } catch (error) {
      console.log('Error during cancellation:', error);
    } finally {
      if(!!onCancel)
        onCancel();
      hasBeenCanceled.current = true;
      setIsStreaming(false);
    }
  };

  return {
    streamedText,
    isStreaming,
    isError,
    startStream,
    cancelStream
  };
};

/**
 * Custom hook to get the current depth level in the path hierarchy.
 * @returns {number} The current depth level.
 */
export const useSupportPathDepth = (): number => {
  return useContext(SupportPathDepthContext);
};

/**
 * Custom hook to get the current key of a support path in the path hierarchy.
 * @returns {string} The key expressed as a string (1, 1.a, 1.a.i, etc.)
 */
export const useSupportPathKey = (): string => {
  return useContext(SupportPathKeyContext);
};


/**
 * Custom hook to scroll to an element with an id provided as a hash in the url
 */
export const useScrollToHash = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const elementId = location.hash.substring(1); // Remove the '#' character
      const element = document.getElementById(elementId);

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [location]);
};
export default useScrollToHash;

/**
 * Custom hook to track the index of hovered compressed edges in the evidence modal 
 */
export const useHoveredIndex = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getHoverHandlers = useCallback(
    (index: number) => ({
      onMouseEnter: () => setHoveredIndex(index),
      onMouseLeave: () => setHoveredIndex(null),
    }),
    []
  );

  return {
    hoveredIndex,
    getHoverHandlers,
    resetHoveredIndex: () => setHoveredIndex(null),
  };
};

/**
 * Custom hook to handle seen/unseen status on edges and paths
 */
export const useSeenStatus = (pk: string) => {
  const dispatch: AppDispatch = useDispatch();

  const seenStatus = useSelector((state: RootState) =>
    state.seenStatus[pk] || { seenEdges: [], seenPaths: [] }
  );

  const isEdgeSeen = (edgeId: string): boolean => seenStatus.seenEdges.includes(edgeId);
  const seenEdges = useSelector((state: RootState) => state.seenStatus[pk]?.seenEdges || []);
  const seenEdgeSet = useMemo(() => new Set(seenEdges), [seenEdges]);
  const isPathSeen = (edgeIds: string[]): boolean => edgeIds.every((id) => seenEdgeSet.has(id));
  const handleMarkEdgeSeen = (edgeId: string) => dispatch(markEdgeSeen({ pk, edgeId }));
  const handleMarkEdgeUnseen = (edgeId: string) => dispatch(markEdgeUnseen({ pk, edgeId }));
  const resetStatus = () => dispatch(resetSeenStatus({ pk }));

  return {
    seenEdges: seenStatus.seenEdges,
    isEdgeSeen,
    isPathSeen,
    markEdgeSeen: handleMarkEdgeSeen,
    markEdgeUnseen: handleMarkEdgeUnseen,
    resetStatus,
  };
};

/**
 * Returns the current disclaimer approval status based on persistent localStorage values,
 * and updates document title to include the provided title.
 * Handles expiry logic for login disclaimers (1 year).
 *
 * @param {string} title - The base page title to append to the document title.
 * @returns {[boolean, (value: boolean) => void]} - The current disclaimer approval status and a setter function.
 */
export const useDisclaimersApproved = (title: string): [boolean, (value: boolean) => void] => {
  const [isDisclaimerApproved, setIsDisclaimerApproved] = useState<boolean>(false);

  useEffect(() => {
    const rawDisclaimer = localStorage.getItem('disclaimerApproved');
    const disclaimerApproved = rawDisclaimer ? JSON.parse(rawDisclaimer) : false;

    const loginDisclaimerRaw = localStorage.getItem('loginDisclaimerApproved');
    let initDisclaimerApproval = disclaimerApproved;

    if (window.location.pathname.includes('login') && loginDisclaimerRaw) {
      try {
        const { approved, timestamp } = JSON.parse(loginDisclaimerRaw);
        const oneYear = 365 * 24 * 60 * 60 * 1000; // ms in one year
        const isOlderThanOneYear = Date.now() - timestamp > oneYear;

        if (isOlderThanOneYear) {
          localStorage.removeItem('loginDisclaimerApproved');
          initDisclaimerApproval = false;
        } else {
          initDisclaimerApproval = approved;
        }
      } catch {
        initDisclaimerApproval = false;
      }
    }

    setIsDisclaimerApproved(initDisclaimerApproval);
    document.title = `${title} - NCATS Biomedical Data Translator`;
  }, [title]);

  return [isDisclaimerApproved, setIsDisclaimerApproved];
};