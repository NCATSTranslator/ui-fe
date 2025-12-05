import { useState, useEffect, useRef, Dispatch, SetStateAction, RefObject } from 'react';
import { isEqual } from 'lodash';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { FeedbackForm, FormErrors, Timeout } from '@/features/Common/types/global';
import { ResultContextObject } from '@/features/ResultList/utils/llm';

interface WindowSize {
  width: number | undefined;
  height: number | undefined;
}

interface DeepDifference {
  path: string;
  from: unknown;
  to: unknown;
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
 * @param {() => void} callback - The callback function to be executed.
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
const logDeepDifferences = (obj1: Record<string, unknown>, obj2: Record<string, unknown>, name: string, path: string = ''): DeepDifference[] => {
  const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
  let changes: DeepDifference[] = [];

  keys.forEach(key => {
      const newPath = path ? `${path}.${key}` : key;
      const value1 = obj1[key];
      const value2 = obj2[key];

      if (typeof value1 === 'object' && value1 != null && typeof value2 === 'object' && value2 != null) {
          changes = changes.concat(logDeepDifferences(value1 as Record<string, unknown>, value2 as Record<string, unknown>, name, newPath));
      } else if (!isEqual(value1, value2)) {
          changes.push({ path: newPath, from: value1, to: value2 });
      }
  });

  return changes;
};

export const useWhyDidComponentUpdate = <T extends Record<string, unknown>>(name: string, props: T) => {
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
  resultContext: RefObject<ResultContextObject[] | null>,
  onComplete?: () => void,
  onCancel?: () => void
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

  const { isError, refetch, data, error } = useQuery({
    queryKey: ['textStream'],
    queryFn: () => {
      abortControllerRef.current = new AbortController();
      return fetchTextStream(abortControllerRef.current.signal);
    },
    enabled: false,
    refetchOnWindowFocus: false,
    retry: 3
  });

  useEffect(() => {
    if (data !== undefined) {
      setIsStreaming(false);
      if (!!onComplete && data !== null && !hasBeenCanceled.current) 
        onComplete();
      hasBeenCanceled.current = false;
    }
  }, [data, onComplete]);

  useEffect(() => {
    if (error) {
      setIsStreaming(false);
      if (!(error instanceof Error && error.name === 'AbortError')) {
        console.error('Stream error:', error);
      }
    }
  }, [error]);

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
 * Returns the current disclaimer approval status based on persistent localStorage values,
 * and updates document title to include the provided title.
 * Handles expiry logic for login disclaimers (1 year).
 *
 * @param {string} title - The base page title to append to the document title.
 * @returns {[boolean, Dispatch<SetStateAction<boolean>>]} - The current disclaimer approval status and a setter function.
 */
export const useDisclaimersApproved = (title: string): [boolean, Dispatch<SetStateAction<boolean>>] => {
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
  }, [title]);

  return [isDisclaimerApproved, setIsDisclaimerApproved];
};

/**
 * Custom hook for managing feedback form state and validation
 */
export const useFeedbackForm = () => {
  const [form, setForm] = useState<FeedbackForm>({
    category: 'Suggestion',
    comments: '',
    steps: '',
    screenshots: [],
    base64Screenshots: [],
  });

  const [errors, setErrors] = useState<FormErrors>({
    category: false,
    comments: false,
    steps: false,
  });

  const [touched, setTouched] = useState<Record<keyof FormErrors, boolean>>({
    category: false,
    comments: false,
    steps: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateField = <K extends keyof FeedbackForm>(key: K, value: FeedbackForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (key in errors) {
      setErrors(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleFieldBlur = (field: keyof FormErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const showFieldError = (field: keyof FormErrors) => {
    return touched[field] && errors[field];
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      category: !form.category,
      comments: !form.comments.trim(),
      steps: form.category === 'Bug Report' && !form.steps.trim(),
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const resetForm = () => {
    setForm({
      category: 'Suggestion',
      comments: '',
      steps: '',
      screenshots: [],
      base64Screenshots: [],
    });
    setErrors({
      category: false,
      comments: false,
      steps: false,
    });
    setTouched({
      category: false,
      comments: false,
      steps: false,
    });
    setSubmitError(null);
  };

  return {
    form,
    errors,
    touched,
    isSubmitting,
    submitError,
    updateField,
    handleFieldBlur,
    showFieldError,
    validateForm,
    resetForm,
    setIsSubmitting,
    setSubmitError,
  };
};