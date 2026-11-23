// Focus: Ordering publications by the user's evidence sort preference
import { sortTitleHighLow, sortTitleLowHigh, sortJournalHighLow, sortJournalLowHigh,
  sortDateYearHighLow, sortDateYearLowHigh } from '@/features/Core/utils/sortingFunctions';
import { SortPreference } from '@/features/Evidence/types/evidence';

/**
 * Retrieves the appropriate sorting function based on the sort preference.
 *
 * @param {SortPreference} sortPreference - The sorting preference (e.g., "dateHighLow", "titleLowHigh").
 * @returns {Function} - The corresponding sorting function for the given preference.
 */
export const getSortingFunction = (sortPreference: SortPreference) => {
  const sortFunctions = {
    dateHighLow: sortDateYearHighLow,
    dateLowHigh: sortDateYearLowHigh,
    journalHighLow: sortJournalHighLow,
    journalLowHigh: sortJournalLowHigh,
    titleHighLow: sortTitleHighLow,
    titleLowHigh: sortTitleLowHigh,
  };
  return sortFunctions[sortPreference];
};
