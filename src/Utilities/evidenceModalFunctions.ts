import { Dispatch, SetStateAction } from 'react';
import { sortNameHighLow, sortNameLowHigh, sortJournalHighLow, sortJournalLowHigh,
  sortDateYearHighLow, sortDateYearLowHigh } from './sortingFunctions';
import { cloneDeep } from 'lodash';
import { capitalizeAllWords } from "./utilities";
import { EvidenceSortState, PublicationObject, RawPublicationList } from '../Types/evidence';
import { ResultEdge, ResultSet } from '../Types/results';
import { getPubById } from '../Redux/resultsSlice';

export const handleEvidenceSort = (sortName: string, pubmedEvidence: PublicationObject[], handlePageClick: (event: any) => void, 
  sortingStateSetter: Dispatch<SetStateAction<EvidenceSortState>>, setPubmedEvidence: Dispatch<SetStateAction<PublicationObject[]>>) => {

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

export const checkForEdgeMatch = (edgeOne: ResultEdge | null, edgeTwo: ResultEdge | null) => {
  return (!!edgeOne && !!edgeTwo &&  edgeOne.id === edgeTwo?.id);
}

export const updateJournal = (element: PublicationObject, data: any) => {
  if(!element.journal && element.id)
    element.journal = capitalizeAllWords(data[element.id].journal_name);
}
export const updateTitle = (element: PublicationObject, data: any) => {
  if(!element.title && element.id)
    element.title = capitalizeAllWords(data[element.id].article_title.replace('[', '').replace(']',''));
}
export const updateSnippet = (element: PublicationObject, data: any) => {
  if(!element.snippet && element.id)
    element.snippet = data[element.id].abstract;
}
export const updatePubdate = (element: PublicationObject, data: any) => {
  if(!element.pubdate && element.id) {
    let year = (data[element.id].pub_year) ? data[element.id].pub_year: 0;
    element.pubdate = year;
  }
}

export const getKnowledgeLevelString = (knowledgeLevel: string): string => {
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

export const generatePubmedURL = (id: string): string => {
  if(id.includes("PMC")) 
    return `https://www.ncbi.nlm.nih.gov/pmc/${id}`;
  if(id.includes("PMID"))
    return `http://www.ncbi.nlm.nih.gov/pubmed/${id.replace("PMID:", "")}`;

  return "";
}

export const flattenPublicationsObject = (resultSet: ResultSet | null, pubs: RawPublicationList): PublicationObject[] => {
  const pubArray: PublicationObject[] = [];
  if(!resultSet)
    return pubArray;

  for (const key in pubs) {
    const entries = pubs[key];
    for (const entryID of entries) {
      const pub = getPubById(resultSet, entryID.id);
      if(!!pub) {
        pubArray.push({
          knowledgeLevel: key, 
          id: entryID.id,
          source: pub.source,
          support: pub.support || null,
          type: pub.type,
          url: pub.url
        });
      }
    }
  }
  return pubArray;
}