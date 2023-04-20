import { getLastPubYear } from "./utilities";

// alphabetical order
export const sortNameLowHigh = (items, isEvidence) => {
  if(isEvidence)
    return items.sort((a, b) => !a.title - !b.title || a.title.localeCompare(b.title));
  else
    return items.sort((a, b) => !a.name - !b.name || a.name.localeCompare(b.name));
}

// reverse alphabetical order
export const sortNameHighLow = (items, isEvidence) => {
  if(isEvidence)
    return items.sort((a, b) => -a.title.localeCompare(b.title));
  else
    return items.sort((a, b) => -a.name.localeCompare(b.name));
}

// alphabetical order
export const sortSourceLowHigh = (items) => {
  return items.sort((a, b) => !a.source - !b.source || a.source.localeCompare(b.source));
}

// reverse alphabetical order
export const sortSourceHighLow = (items) => {
  return items.sort((a, b) => -a.source.localeCompare(b.source));
}

export const sortEvidenceLowHigh = (items) => {
  return items.sort((a, b) => a.evidence.length - b.evidence.length);
}

export const sortEvidenceHighLow = (items) => {
  return items.sort((a, b) => b.evidence.length - a.evidence.length);
}

export const sortScoreLowHigh = (items) => {
  return items.sort((a, b) => a.score - b.score);
}

export const sortScoreHighLow = (items) => {
  return items.sort((a, b) => b.score - a.score);
}

export const sortByEntityStrings = (items, strings) => {
  return items.sort((a, b) => {
    const nameA = a.name.toLowerCase();
    for(const string of strings) {
      if(nameA.includes(string.toLowerCase()))
        return -1;
    }
    return 1;
  });
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

export const filterCompare = (filter1, filter2) => {
  return filter1.type < filter2.type;
}

// Given a result, a tag, and a ranking of paths, update the rank of a path to be lower if the
// tag appears in the path.
export const updatePathRankByTag = (result, tag, pathRanks) => {
  result.paths.forEach((path, i) => {
    if (path.path.tags[tag] !== undefined) {
      pathRanks[i].rank -= 1;
    }
  });
}
