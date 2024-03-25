import { equal } from 'mathjs';

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
    return items.sort((a, b) => !a.title - !b.title || -a.title.localeCompare(b.title));
  else
    return items.sort((a, b) => !a.name - !b.name || -a.name.localeCompare(b.name));
}

// alphabetical order
export const sortJournalLowHigh = (items) => {
  return items.sort((a, b) => !a.journal - !b.journal || a.journal.localeCompare(b.journal));
}

// reverse alphabetical order
export const sortJournalHighLow = (items) => {
  return items.sort((a, b) => !a.journal - !b.journal || -a.journal.localeCompare(b.journal));
}

export const sortEvidenceLowHigh = (items) => {
  return items.sort((a, b) => Object.keys(a.evidence.publications).length - Object.keys(b.evidence.publications).length);
}

export const sortEvidenceHighLow = (items) => {
  return items.sort((a, b) => Object.keys(b.evidence.publications).length - Object.keys(a.evidence.publications).length);
}

export const sortScoreLowHigh = (items) => {
  return items.sort((a, b) => {
    if (equal(a.score.main, b.score.main)) {
      return a.score.secondary - b.score.secondary;
    }

    return a.score.main - b.score.main;
  });
}

export const sortScoreHighLow = (items) => {
  return items.sort((a, b) => {
    if (equal(a.score.main, b.score.main)) {
      return b.score.secondary - a.score.secondary;
    }

    return b.score.main - a.score.main;
  });
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

export const sortSupportByEntityStrings = (items, strings) => {
  return items.sort((a, b) => {
    const nameA = a.path.stringName.toLowerCase();
    for(const string of strings) {
      if(nameA.includes(string.toLowerCase()))
        return -1;
    }
    return 1;
  });
}

export const sortSupportByLength = (items) => {
  return items.sort((a, b) => {
    if(!a?.path?.subgraph.length || !b?.path?.subgraph.length) 
      return 1;
    return a.path.subgraph.length - b.path.subgraph.length;
  });
}

export const sortDateYearLowHigh = (items) => {
  const failYear = 3000; // Ensure all invalid dates are sent to the end
  return items.sort((a, b) => {
    const aDate = (a.pubdate === null) ? failYear : a.pubdate;
    const bDate = (b.pubdate === null) ? failYear : b.pubdate;
    return (aDate - bDate);
  });
}

export const sortDateYearHighLow = (items) => {
  const failYear = 0; // Ensure all invalid dates are sent to the end
  return items.sort((a, b) => {
    const aDate = (a.pubdate === null) ? failYear : a.pubdate;
    const bDate = (b.pubdate === null) ? failYear : b.pubdate;
    return (bDate - aDate);
  });
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
  result.compressedPaths.forEach((path, i) => {
    if (path.path.tags[tag] !== undefined) {
      pathRanks[i].rank -= 1;
    }
  });
}

export const compareByKeyLexographic = (k) => {
  return (a, b) => { return a[k].localeCompare(b[k]) };
} 
