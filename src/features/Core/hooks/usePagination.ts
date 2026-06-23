import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface UsePaginationReturn<T> {
  itemsPerPage: number;
  currentPage: number;
  itemOffset: number;
  endOffset: number;
  displayedItems: T[];
  pageCount: number;
  handlePageClick: (event: { selected: number }) => void;
  handleItemsPerPageChange: (value: number) => void;
  resetPage: () => void;
}

/**
 * Custom hook to handle pagination of a list of items.
 * 
 * @param {T[]} items - The list of items to paginate.
 * @param {number} itemsPerPageFromPrefs - The number of items per page to display.
 * @returns {UsePaginationReturn<T>} The pagination return object.
 */
export const usePagination = <T,>(items: T[], itemsPerPageFromPrefs: number): UsePaginationReturn<T> => {
  const [itemsPerPage, setItemsPerPage] = useState(itemsPerPageFromPrefs);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemOffset, setItemOffset] = useState(0);

  const endOffset = Math.min(itemOffset + itemsPerPage, items.length);

  const displayedItems = useMemo(() => {
    return items.slice(itemOffset, endOffset);
  }, [items, itemOffset, endOffset]);

  const pageCount = useMemo(() => {
    return Math.ceil(items.length / itemsPerPage);
  }, [items.length, itemsPerPage]);

  const handlePageClick = useCallback((event: { selected: number }) => {
    if (!items.length) {
      setCurrentPage(0);
      setItemOffset(0);
      return;
    }
    const maxPage = Math.max(0, Math.ceil(items.length / itemsPerPage) - 1);
    const selectedPage = Math.min(Math.max(0, event.selected), maxPage);
    setCurrentPage(selectedPage);
    setItemOffset(selectedPage * itemsPerPage);
  }, [itemsPerPage, items.length]);

  const handleItemsPerPageChange = useCallback((value: number) => {
    setItemsPerPage(value);
    setCurrentPage(0);
    setItemOffset(0);
  }, []);

  const resetPage = useCallback(() => {
    setCurrentPage(0);
    setItemOffset(0);
  }, []);

  const prevLengthRef = useRef(items.length);
  useEffect(() => {
    if (prevLengthRef.current !== items.length || (items.length > 0 && itemOffset >= items.length)) {
      setCurrentPage(0);
      setItemOffset(0);
      prevLengthRef.current = items.length;
    }
  }, [items.length, itemOffset]);

  const prevItemsPerPageFromPrefsRef = useRef(itemsPerPageFromPrefs);
  useEffect(() => {
    if (prevItemsPerPageFromPrefsRef.current === itemsPerPageFromPrefs) return;
    prevItemsPerPageFromPrefsRef.current = itemsPerPageFromPrefs;
    setItemsPerPage(itemsPerPageFromPrefs);
    setCurrentPage(0);
    setItemOffset(0);
  }, [itemsPerPageFromPrefs]);

  return {
    itemsPerPage,
    currentPage,
    itemOffset,
    endOffset,
    displayedItems,
    pageCount,
    handlePageClick,
    handleItemsPerPageChange,
    resetPage,
  };
};
