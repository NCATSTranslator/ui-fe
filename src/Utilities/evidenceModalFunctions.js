import { sortNameHighLow, sortNameLowHigh, sortSourceHighLow, sortSourceLowHigh,
  sortDateYearHighLow, sortDateYearLowHigh } from './sortingFunctions';
import { cloneDeep } from 'lodash';

export const handleEvidenceSort = (sortName, pubmedEvidence, handlePageClick, sortingSetters) => {
  let sortedPubmedEvidence = cloneDeep(pubmedEvidence);
  switch (sortName) {
    case 'titleLowHigh':
      sortedPubmedEvidence = sortNameLowHigh(sortedPubmedEvidence, true);
      sortingSetters.setIsSortedByTitle(true);
      sortingSetters.setIsSortedBySource(null);
      sortingSetters.setIsSortedByDate(null);
      break;
    case 'titleHighLow':
      sortedPubmedEvidence = sortNameHighLow(sortedPubmedEvidence, true);
      sortingSetters.setIsSortedByTitle(false);
      sortingSetters.setIsSortedBySource(null);
      sortingSetters.setIsSortedByDate(null);
      break;
    case 'sourceLowHigh':
      sortedPubmedEvidence = sortSourceLowHigh(sortedPubmedEvidence);
      sortingSetters.setIsSortedBySource(true);
      sortingSetters.setIsSortedByTitle(null);
      sortingSetters.setIsSortedByDate(null);
      break;
    case 'sourceHighLow':
      sortedPubmedEvidence = sortSourceHighLow(sortedPubmedEvidence);
      sortingSetters.setIsSortedBySource(false);
      sortingSetters.setIsSortedByTitle(null);
      sortingSetters.setIsSortedByDate(null);
      break;
    case 'dateLowHigh':
      sortedPubmedEvidence = sortDateYearLowHigh(sortedPubmedEvidence);
      sortingSetters.setIsSortedByDate(false);
      sortingSetters.setIsSortedBySource(null);
      sortingSetters.setIsSortedByTitle(null);
      break;
    case 'dateHighLow':
      sortedPubmedEvidence = sortDateYearHighLow(sortedPubmedEvidence);
      sortingSetters.setIsSortedByDate(true);
      sortingSetters.setIsSortedBySource(null);
      sortingSetters.setIsSortedByTitle(null);
      break;
    default:
      break;
  }

  // assign the newly sorted results (no need to set formatted results, since they'll be filtered after being sorted, then set there)
  sortingSetters.setPubmedEvidence(sortedPubmedEvidence);

  // reset to page one.
  handlePageClick({selected: 0});
}

export const checkForEdgeMatch = (edgeOne, edgeTwo) => {
  return (!edgeOne || !edgeTwo ||
    edgeOne.edges[0].subject.id !== edgeTwo.edges[0].subject.id ||
    edgeOne.edges[0].predicate !== edgeTwo.edges[0].predicate || 
    edgeOne.edges[0].object.id !== edgeTwo.edges[0].object.id) 
    ? false
    : true;
  
}