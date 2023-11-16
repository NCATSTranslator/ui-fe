import { sortNameHighLow, sortNameLowHigh, sortSourceHighLow, sortSourceLowHigh,
  sortDateYearHighLow, sortDateYearLowHigh } from './sortingFunctions';
import { cloneDeep } from 'lodash';

export const handleEvidenceSort = (sortName, pubmedEvidence, handlePageClick, sortingStateSetter, setPubmedEvidence) => {
  let sortedPubmedEvidence = cloneDeep(pubmedEvidence);
  let newSortingState = { title: null, source: null, date: null };
  switch (sortName) {
    case 'titleLowHigh':
      sortedPubmedEvidence = sortNameLowHigh(sortedPubmedEvidence, true);
      newSortingState.title = true;
      newSortingState.source = null;
      newSortingState.date = null;
      break;
    case 'titleHighLow':
      sortedPubmedEvidence = sortNameHighLow(sortedPubmedEvidence, true);
      newSortingState.title = false;
      newSortingState.source = null;
      newSortingState.date = null;
      break;
    case 'sourceLowHigh':
      sortedPubmedEvidence = sortSourceLowHigh(sortedPubmedEvidence);
      newSortingState.title = null;
      newSortingState.source = true;
      newSortingState.date = null;
      break;
    case 'sourceHighLow':
      sortedPubmedEvidence = sortSourceHighLow(sortedPubmedEvidence);
      newSortingState.title = null;
      newSortingState.source = false;
      newSortingState.date = null;
      break;
    case 'dateLowHigh':
      sortedPubmedEvidence = sortDateYearLowHigh(sortedPubmedEvidence);
      newSortingState.title = null;
      newSortingState.source = null;
      newSortingState.date = false;
      break;
    case 'dateHighLow':
      sortedPubmedEvidence = sortDateYearHighLow(sortedPubmedEvidence);
      newSortingState.title = null;
      newSortingState.source = null;
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