import { sortNameHighLow, sortNameLowHigh, sortJournalHighLow, sortJournalLowHigh,
  sortDateYearHighLow, sortDateYearLowHigh } from './sortingFunctions';
import { cloneDeep } from 'lodash';
import { capitalizeAllWords } from "./utilities";

export const handleEvidenceSort = (sortName, pubmedEvidence, handlePageClick, sortingStateSetter, setPubmedEvidence) => {
  let sortedPubmedEvidence = cloneDeep(pubmedEvidence);
  let newSortingState = { title: null, journal: null, date: null };
  switch (sortName) {
    case 'titleLowHigh':
      sortedPubmedEvidence = sortNameLowHigh(sortedPubmedEvidence, true);
      newSortingState.title = true;
      newSortingState.journal = null;
      newSortingState.date = null;
      break;
    case 'titleHighLow':
      sortedPubmedEvidence = sortNameHighLow(sortedPubmedEvidence, true);
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
  // assign the newly sorted results (no need to set formatted results, since they'll be filtered after being sorted, then set there)
  setPubmedEvidence(sortedPubmedEvidence);

  // reset to page one.
  handlePageClick({selected: 0});
}

export const checkForEdgeMatch = (edgeOne, edgeTwo) => {
  return (!edgeOne || !edgeTwo ||
    edgeOne.edges[0].subject.id !== edgeTwo.edges[0].subject.id ||
    edgeOne.predicate !== edgeTwo.predicate || 
    edgeOne.edges[0].object.id !== edgeTwo.edges[0].object.id) 
    ? false
    : true;
}

export const updateJournal = (element, data) => {
  if(!element.journal)
    element.journal = capitalizeAllWords(data[element.id].journal_name);
}
export const updateTitle = (element, data) => {
  if(!element.title)
    element.title = capitalizeAllWords(data[element.id].article_title.replace('[', '').replace(']',''));
}
export const updateSnippet = (element, data) => {
  if(!element.snippet)
    element.snippet = data[element.id].abstract;
}
export const updatePubdate = (element, data) => {
  if(!element.pubdate) {
    let year = (data[element.id].pub_year) ? data[element.id].pub_year: 0;
    element.pubdate = year;
  }
}

export const getKnowledgeLevelString = (knowledgeLevel) => {
  let knowledgeLevelString;
  switch (knowledgeLevel) {
    case 'trusted':
      knowledgeLevelString = 'Curated'
      break;
    case 'ml':
      knowledgeLevelString = 'Text-Mined'
      break;
    default:
      knowledgeLevelString = 'Unknown';
      break;
  }
  return knowledgeLevelString;
}