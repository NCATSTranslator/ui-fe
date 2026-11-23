// Focus: Ordering publications by the order chosen for the evidence view's publications section
import { sortTitleHighLow, sortTitleLowHigh, sortJournalHighLow, sortJournalLowHigh,
  sortDateYearHighLow, sortDateYearLowHigh } from '@/features/Core/utils/sortingFunctions';
import { PublicationObject } from '@/features/Evidence/types/evidence';
import { PublicationSortOption } from '@/features/Evidence/utils/evidenceSortOptions';

type PublicationSort = (publications: PublicationObject[]) => PublicationObject[];

// "LowHigh" is ascending: A to Z, or oldest first
const SORT_FUNCTIONS: Record<PublicationSortOption, PublicationSort> = {
  dateHighLow: sortDateYearHighLow,
  dateLowHigh: sortDateYearLowHigh,
  titleHighLow: sortTitleHighLow,
  titleLowHigh: sortTitleLowHigh,
  // The preference calls a publication's journal its "source"
  sourceHighLow: sortJournalHighLow,
  sourceLowHigh: sortJournalLowHigh,
};

/**
 * Orders publications by one of the orders the publications section offers (see
 * resolveEvidenceSort for turning a stored preference into one). Returns a new array.
 *
 * @param {PublicationObject[]} publications - The publications to order.
 * @param {PublicationSortOption} sort - The order to put them in.
 * @returns {PublicationObject[]} The publications in display order.
 */
export const sortPublications = (
  publications: PublicationObject[],
  sort: PublicationSortOption,
): PublicationObject[] => SORT_FUNCTIONS[sort]([...publications]);
