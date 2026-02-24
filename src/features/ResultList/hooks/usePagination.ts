import { useState, useRef, useCallback, useMemo, Dispatch, SetStateAction, RefObject } from 'react';
import { Result } from '@/features/ResultList/types/results.d';

export interface UsePaginationReturn {
  itemOffset: number;
  setItemOffset: Dispatch<SetStateAction<number>>;
  itemsPerPage: number;
  setItemsPerPage: Dispatch<SetStateAction<number>>;
  endResultIndex: number;
  setEndResultIndex: Dispatch<SetStateAction<number>>;
  currentPage: RefObject<number>;
  displayedResults: Result[];
  pageCount: number;
  handlePageClick: (event: { selected: number }, newItemsPerPage?: number | false, resultsLength?: number, currentNumItemsPerPage?: number) => void;
  handlePageReset: (newItemsPerPage: number | false, resultsLength: number) => void;
  calculateItemsPerPage: (prefValue: string | number) => number;
}

interface UsePaginationArgs {
  formattedResults: Result[];
  initialItemsPerPage: number;
}

const usePagination = ({ formattedResults, initialItemsPerPage }: UsePaginationArgs): UsePaginationReturn => {
  const currentPage = useRef(0);
  const [itemOffset, setItemOffset] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(initialItemsPerPage);
  const [endResultIndex, setEndResultIndex] = useState<number>(initialItemsPerPage);

  const displayedResults: Result[] = useMemo(
    () => formattedResults.slice(itemOffset, endResultIndex),
    [formattedResults, itemOffset, endResultIndex]
  );

  const pageCount = useMemo(
    () => Math.ceil(formattedResults.length / itemsPerPage),
    [formattedResults.length, itemsPerPage]
  );

  const calculateItemsPerPage = useCallback((prefValue: string | number): number => {
    return ((!!prefValue) ? (typeof prefValue === "string") ? parseInt(prefValue) : prefValue : 10) as number;
  }, []);

  const handlePageClick = useCallback((
    event: { selected: number },
    newItemsPerPage: number | false = false,
    resultsLength = formattedResults.length,
    currentNumItemsPerPage = itemsPerPage
  ) => {
    let perPageNum = (newItemsPerPage) ? newItemsPerPage : currentNumItemsPerPage;
    currentPage.current = event.selected;
    const newOffset = isNaN((event.selected * perPageNum) % resultsLength) ? 0 : (event.selected * perPageNum) % resultsLength;
    const endOffset = (newOffset + perPageNum > resultsLength)
      ? resultsLength
      : newOffset + perPageNum;
    setItemOffset(newOffset);
    setEndResultIndex(endOffset);
  }, [formattedResults.length, itemsPerPage]);

  const handlePageReset = useCallback((newItemsPerPage: number | false, resultsLength: number) => {
    handlePageClick({ selected: 0 }, newItemsPerPage, resultsLength);
  }, [handlePageClick]);

  return {
    itemOffset,
    setItemOffset,
    itemsPerPage,
    setItemsPerPage,
    endResultIndex,
    setEndResultIndex,
    currentPage,
    displayedResults,
    pageCount,
    handlePageClick,
    handlePageReset,
    calculateItemsPerPage,
  };
};

export default usePagination;
