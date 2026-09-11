import { useState, useRef, useCallback, useMemo, Dispatch, SetStateAction, RefObject } from 'react';
import { Result } from '@/features/ResultList/types/results.d';
import { trackEvent } from '@/features/Analytics/utils/dataLayer';

export interface UseResultPaginationReturn {
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
  handlePageChange: (event: { selected: number }, newItemsPerPage?: number | false, resultsLength?: number, currentNumItemsPerPage?: number) => void;
  handlePageReset: (newItemsPerPage: number | false, resultsLength: number) => void;
  calculateItemsPerPage: (prefValue: string | number) => number;
}

interface UseResultPaginationArgs {
  formattedResults: Result[];
  initialItemsPerPage: number;
}

/**
 * Custom hook to handle pagination of a list of results.
 *
 * @param {Result[]} formattedResults - The list of results to paginate.
 * @param {number} initialItemsPerPage - The number of items per page to display.
 * @returns {UseResultPaginationReturn} The pagination return object.
 */
const useResultPagination = ({ formattedResults, initialItemsPerPage }: UseResultPaginationArgs): UseResultPaginationReturn => {
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

  // Untracked page change, for anything other than a user paging through
  // results: resets after filtering or a per-page change, and jumping to a
  // shared result's page. Counting those would inflate results_paginated, so
  // handlePageClick wraps this and is the only path that reports.
  const handlePageChange = useCallback((
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
    return perPageNum;
  }, [formattedResults.length, itemsPerPage]);

  const handlePageClick = useCallback((
    event: { selected: number },
    newItemsPerPage: number | false = false,
    resultsLength = formattedResults.length,
    currentNumItemsPerPage = itemsPerPage
  ) => {
    const perPageNum = handlePageChange(event, newItemsPerPage, resultsLength, currentNumItemsPerPage);
    trackEvent('results_paginated', {
      // GA4 reports read better 1-indexed; react-paginate is 0-indexed.
      page_number: event.selected + 1,
      items_per_page: perPageNum,
    });
  }, [handlePageChange, formattedResults.length, itemsPerPage]);

  const handlePageReset = useCallback((newItemsPerPage: number | false, resultsLength: number) => {
    handlePageChange({ selected: 0 }, newItemsPerPage, resultsLength);
  }, [handlePageChange]);

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
    handlePageChange,
    handlePageReset,
    calculateItemsPerPage,
  };
};

export default useResultPagination;
