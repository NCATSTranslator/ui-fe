import { useState, useRef, useCallback, useEffect, Dispatch, SetStateAction, RefObject } from 'react';
import { SharedItem } from '@/features/ResultList/types/results.d';

export interface UseShareStateReturn {
  shareResultID: RefObject<string | null>;
  setShareResultID: (newID: string | null) => void;
  sharedItem: SharedItem;
  setSharedItem: Dispatch<SetStateAction<SharedItem>>;
  setAutoScrollToResult: Dispatch<SetStateAction<boolean>>;
  expandSharedResult: boolean;
  setExpandSharedResult: Dispatch<SetStateAction<boolean>>;
  sharedItemRef: RefObject<HTMLDivElement | null>;
  shareModalOpen: boolean;
  setShareModalOpen: Dispatch<SetStateAction<boolean>>;
  focusModalOpen: boolean;
  setFocusModalOpen: Dispatch<SetStateAction<boolean>>;
  resultIdParam: string | null;
  setResultIdParam: Dispatch<SetStateAction<string | null>>;
  resetShareState: () => void;
}

interface UseShareStateArgs {
  initialResultIdParam: string | null;
}

const useShareState = ({
  initialResultIdParam,
}: UseShareStateArgs): UseShareStateReturn => {
  const shareResultID = useRef<string | null>(null);
  const setShareResultID = useCallback((newID: string | null) => {
    shareResultID.current = newID;
  }, []);

  const [sharedItem, setSharedItem] = useState<SharedItem>({ index: 0, page: 0, name: '', type: '' });
  const [autoScrollToResult, setAutoScrollToResult] = useState(false);
  const [expandSharedResult, setExpandSharedResult] = useState(false);
  const sharedItemRef = useRef<HTMLDivElement | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [resultIdParam, setResultIdParam] = useState(initialResultIdParam);

  // Auto-scroll to shared result
  useEffect(() => {
    if (!autoScrollToResult)
      return;

    const yOffset = -60;
    if (!!sharedItemRef.current) {
      const y = sharedItemRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.document.querySelector('main.content')?.scrollTo({ top: y, behavior: 'smooth' });
      setAutoScrollToResult(false);
    }
  }, [autoScrollToResult]);

  const resetShareState = useCallback(() => {
    shareResultID.current = null;
    setSharedItem({ index: 0, page: 0, name: '', type: '' });
    setAutoScrollToResult(false);
    setExpandSharedResult(false);
    setShareModalOpen(false);
    setFocusModalOpen(false);
  }, []);

  return {
    shareResultID,
    setShareResultID,
    sharedItem,
    setSharedItem,
    setAutoScrollToResult,
    expandSharedResult,
    setExpandSharedResult,
    sharedItemRef,
    shareModalOpen,
    setShareModalOpen,
    focusModalOpen,
    setFocusModalOpen,
    resultIdParam,
    setResultIdParam,
    resetShareState,
  };
};

export default useShareState;
