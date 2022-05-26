import { getLastPubYear } from "./utilities";

export const sortNameLowHigh = (items) => {
  return items.sort((a, b) => a.subject.name.localeCompare(b.subject.name));
}

export const sortNameHighLow = (items) => {
  return items.sort((a, b) => -a.subject.name.localeCompare(b.subject.name));
}

export const sortEvidenceLowHigh = (items) => {
  return items.sort((a, b) => a.edge.evidence.length - b.edge.evidence.length);
}

export const sortEvidenceHighLow = (items) => {
  return items.sort((a, b) => b.edge.evidence.length - a.edge.evidence.length);
}


export const sortDateLowHigh = (items) => {

  return items.sort((a, b) => { 
    let val1 = getLastPubYear(a.edge.last_publication_date); 
    let val2 = getLastPubYear(b.edge.last_publication_date); 
    
    if(val1 === val2)
      return 0;
    if(val1 === null)
      val1 = Infinity;
    if(val2 === null)
      val2 = Infinity;

    return (val1 - val2);
    }
  );
}

export const sortDateHighLow = (items) => {
  return items.sort((a, b) => 
    (b.edge.last_publication_date != null ? getLastPubYear(b.edge.last_publication_date) : 0) 
      - 
    (a.edge.last_publication_date != null ? getLastPubYear(a.edge.last_publication_date) : 0)
  );
}

export const sortByHighlighted = (totalItems, highlightedItems) => {
  let sortedItems = [
    ...totalItems.filter(item => highlightedItems.includes(item)),
    ...totalItems.filter(item => !highlightedItems.includes(item))
  ];
  return sortedItems;
}