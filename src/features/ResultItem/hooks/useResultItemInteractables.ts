import { useState, useCallback } from 'react';
import { ReactNode } from 'react';

export interface SummaryState {
  content: ReactNode | null;
  hasCached: boolean;
}

export const createStorageKey = (resultId: string): string => `resultSummary_${resultId}`;
export const sanitizeNameString = (nameString: string): string => nameString.replaceAll("'", "");

const checkAndSetCachedSummary = (storageKey: string): SummaryState => {
  const cachedSummary = localStorage.getItem(storageKey);
  return {
    content: cachedSummary,
    hasCached: !!cachedSummary
  };
};

export const useSummaryState = (resultId: string, fetchSummaryFn?: () => Promise<{ data?: { response_text?: string } }>) => {
  const storageKey = createStorageKey(resultId);
  
  const [summaryState, setSummaryState] = useState<SummaryState>(() => 
    checkAndSetCachedSummary(storageKey)
  );
  const [isLoading, setIsLoading] = useState(false);

  const updateSummary = useCallback((content: ReactNode | null) => {
    setSummaryState({
      content,
      hasCached: !!content
    });
    
    if (content) {
      localStorage.setItem(storageKey, content as string);
    }
  }, [storageKey]);

  const clearSummary = useCallback(() => {
    setSummaryState({ content: null, hasCached: false });
  }, []);

  const fetchAndUpdateSummary = useCallback(async () => {
    if (!fetchSummaryFn) return;
    
    setIsLoading(true);
    try {
      const res = await fetchSummaryFn();
      const responseText = res?.data?.response_text;
      
      if (responseText) {
        const htmlText = responseText.replace(/\n/g, '<br />');
        updateSummary(htmlText);
      } else {
        updateSummary(null);
      }
    } catch (error) {
      console.error(error);
      updateSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSummaryFn, updateSummary]);

  const clearAndRefetchSummary = useCallback(async () => {
    clearSummary();
    await fetchAndUpdateSummary();
  }, [clearSummary, fetchAndUpdateSummary]);

  return {
    summaryState,
    isLoading,
    updateSummary,
    clearSummary,
    fetchAndUpdateSummary,
    clearAndRefetchSummary,
    storageKey
  };
};