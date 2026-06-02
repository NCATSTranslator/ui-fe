import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Preferences } from "@/features/UserAuth/types/user";
import { getInitItemsPerPage } from "@/features/Evidence/utils/evidenceModalFunctions";
import { DEFAULT_ITEMS_PER_PAGE } from "@/features/Evidence/hooks/evidenceHooks";

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
 * Generic, offset-based pagination hook for table-style lists. Owns the
 * pagination state (items per page, current page, item offset) and derives the
 * current page slice and total page count. The initial items-per-page value is
 * read from user preferences and kept in sync if those preferences change.
 *
 * @param {T[]} items - The full list of items to paginate.
 * @param {Preferences} prefs - User preferences, used to seed items-per-page.
 * @returns {UsePaginationReturn<T>} Pagination state, the current page slice, and handlers.
 */
export const usePagination = <T,>(items: T[], prefs: Preferences): UsePaginationReturn<T> => {
  const [itemsPerPage, setItemsPerPage] = useState(() => getInitItemsPerPage(prefs, DEFAULT_ITEMS_PER_PAGE));
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
    const newOffset = items.length ? (event.selected * itemsPerPage) % items.length : 0;
    setCurrentPage(event.selected);
    setItemOffset(newOffset);
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

  // Reset to page 0 when the items array changes length or the current
  // offset falls beyond the end of the list (e.g. after filtering).
  const prevLengthRef = useRef(items.length);
  useEffect(() => {
    if (prevLengthRef.current !== items.length || (items.length > 0 && itemOffset >= items.length)) {
      setCurrentPage(0);
      setItemOffset(0);
      prevLengthRef.current = items.length;
    }
  }, [items.length, itemOffset]);

  // Keep items-per-page in sync with user preferences.
  const prefValue = prefs?.evidence_per_page?.pref_value;
  useEffect(() => {
    const newValue = getInitItemsPerPage(prefs, DEFAULT_ITEMS_PER_PAGE);
    setItemsPerPage(newValue);
    setCurrentPage(0);
    setItemOffset(0);
  }, [prefValue]);

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
