// Focus: Evidence modal-specific functionality and UI state management

import { Dispatch, SetStateAction } from 'react';
import { sortNameHighLow, sortNameLowHigh, sortJournalHighLow, sortJournalLowHigh,
  sortDateYearHighLow, sortDateYearLowHigh } from '@/features/Common/utils/sortingFunctions';
import { cloneDeep } from 'lodash';
import { EvidenceSortState, PublicationObject, SortingState, SortPreference } from '@/features/Evidence/types/evidence';
import { PreferencesContainer } from '@/features/UserAuth/types/user';

/**
 * Sorts PubMed evidence based on the specified sorting criteria and updates the state.
 *
 * @param {string} sortName - The sorting criteria (e.g., "titleLowHigh", "dateHighLow").
 * @param {PublicationObject[]} pubmedEvidence - The current list of publication objects.
 * @param {(event: {selected: number}) => void} handlePageClick - Function to reset pagination to page one.
 * @param {Dispatch<SetStateAction<EvidenceSortState>>} sortingStateSetter - State setter for the sorting state.
 * @param {Dispatch<SetStateAction<PublicationObject[]>>} setPubmedEvidence - State setter for the sorted publication objects.
 * @returns {void} - This function does not return a value but updates the state directly.
 */
export const handleEvidenceSort = (
  sortName: string,
  pubmedEvidence: PublicationObject[],
  handlePageClick: (event: {selected: number}) => void, 
  sortingStateSetter: Dispatch<SetStateAction<EvidenceSortState>>,
  setPubmedEvidence: Dispatch<SetStateAction<PublicationObject[]>>
) => {

  let sortedPubmedEvidence = cloneDeep(pubmedEvidence);
  let newSortingState: EvidenceSortState = { title: null, journal: null, date: null };
  switch (sortName) {
    case 'titleLowHigh':
      sortedPubmedEvidence = sortNameLowHigh(sortedPubmedEvidence) as PublicationObject[];
      newSortingState.title = true;
      newSortingState.journal = null;
      newSortingState.date = null;
      break;
    case 'titleHighLow':
      sortedPubmedEvidence = sortNameHighLow(sortedPubmedEvidence) as PublicationObject[];
      newSortingState.title = false;
      newSortingState.journal = null;
      newSortingState.date = null;
      break;
    case 'journalLowHigh':
      sortedPubmedEvidence = sortJournalLowHigh(sortedPubmedEvidence);
      newSortingState.title = null;
      newSortingState.journal = true;
      newSortingState.date = null;
      break;
    case 'journalHighLow':
      sortedPubmedEvidence = sortJournalHighLow(sortedPubmedEvidence);
      newSortingState.title = null;
      newSortingState.journal = false;
      newSortingState.date = null;
      break;
    case 'dateLowHigh':
      sortedPubmedEvidence = sortDateYearLowHigh(sortedPubmedEvidence);
      newSortingState.title = null;
      newSortingState.journal = null;
      newSortingState.date = false;
      break;
    case 'dateHighLow':
      sortedPubmedEvidence = sortDateYearHighLow(sortedPubmedEvidence);
      newSortingState.title = null;
      newSortingState.journal = null;
      newSortingState.date = true;
      break;
    default:
      break;
  }

  sortingStateSetter(newSortingState);
  setPubmedEvidence(sortedPubmedEvidence);

  // reset to page one.
  handlePageClick({selected: 0});
}



/**
 * Retrieves the initial number of items per page from user preferences.
 *
 * @param {PreferencesContainer} prefs - The user preferences container.
 * @param {number} defaultItemsPerPage - The default number of items per page if no preference is set.
 * @returns {number} - The number of items per page from preferences or the default value.
 */
export const getInitItemsPerPage = (prefs: PreferencesContainer, defaultItemsPerPage: number): number => {
  const value = prefs?.evidence_per_screen?.pref_value;
  if (!value) return defaultItemsPerPage;
  
  return typeof value === "string" ? parseInt(value) : value;
};

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
    titleHighLow: sortNameHighLow,
    titleLowHigh: sortNameLowHigh,
  };
  return sortFunctions[sortPreference];
};

/**
 * Generates the sorting state update object based on the sort preference.
 *
 * @param {SortPreference} sortPreference - The sorting preference (e.g., "dateHighLow", "titleLowHigh").
 * @returns {SortingState} - The corresponding sorting state object with the appropriate column states.
 */
export const getSortingStateUpdate = (sortPreference: SortPreference): SortingState => {
  const stateUpdates = {
    dateHighLow: { title: null, journal: null, date: true },
    dateLowHigh: { title: null, journal: null, date: false },
    journalHighLow: { title: null, journal: false, date: null },
    journalLowHigh: { title: null, journal: true, date: null },
    titleHighLow: { title: false, journal: null, date: null },
    titleLowHigh: { title: true, journal: null, date: null },
  };
  return stateUpdates[sortPreference];
};