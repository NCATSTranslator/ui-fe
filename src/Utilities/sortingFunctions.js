import { equal } from 'mathjs';
import { getPathsCount } from './utilities';
import { hasSupport } from './resultsFormattingFunctions';

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
  return items.sort((a, b) => a.evidenceCounts.publicationCount - b.evidenceCounts.publicationCount);
}

export const sortEvidenceHighLow = (items) => {
  return items.sort((a, b) => b.evidenceCounts.publicationCount - a.evidenceCounts.publicationCount);
}

export const sortPathsLowHigh = (items) => {
  return items.sort((a, b) => getPathsCount(a.compressedPaths) - getPathsCount(b.compressedPaths));
}

export const sortPathsHighLow = (items) => {
  return items.sort((a, b) => getPathsCount(b.compressedPaths) - getPathsCount(a.compressedPaths));
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
    const nameB = b.path.stringName.toLowerCase();

    const nameAIncludesString = strings.some(string => nameA.includes(string.toLowerCase()));
    const nameBIncludesString = strings.some(string => nameB.includes(string.toLowerCase()));

    if (nameAIncludesString && !nameBIncludesString) {
      return -1;
    }
    if (!nameAIncludesString && nameBIncludesString) {
      return 1;
    }

    // If both or neither include a string, sort by the length of subgraph
    const lengthA = a.path.subgraph.length;
    const lengthB = b.path.subgraph.length;

    return lengthA - lengthB;
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

export const sortByNamePathfinderLowHigh = (items) => {
  return items.sort(
    (a,b) => {
      const countSlashes = (str) => (str.match(/\//g) || []).length;

      const slashCountA = countSlashes(a.name);
      const slashCountB = countSlashes(b.name);

      // First, sort by the number of slashes
      if (slashCountA !== slashCountB) {
        return slashCountA - slashCountB;
      }

      // If the slash count is the same, sort alphabetically
      return a.name.localeCompare(b.name);
    }
  );
};

export const sortByNamePathfinderHighLow = (items) => {
  return items.sort(
    (a,b) => {
      const countSlashes = (str) => (str.match(/\//g) || []).length;

      const slashCountA = countSlashes(a.name);
      const slashCountB = countSlashes(b.name);

      // First, sort by the number of slashes in reverse order (most slashes first)
      if (slashCountA !== slashCountB) {
        return slashCountB - slashCountA;
      }

      // If the slash count is the same, sort alphabetically in reverse order
      return b.name.localeCompare(a.name);
    }
  );
};

export const filterCompare = (filter1, filter2) => {
  return filter1.family < filter2.family;
}

export const compareByKeyLexographic = (k) => {
  return (a, b) => { return a[k].localeCompare(b[k]) };
}

// Returns a shallow copy of an array sorted independently on the left and right side of the pivot point
export const pivotSort = (arr, pivot, compare) => {
  const left = arr.slice(0, pivot).sort(compare);
  const right = arr.slice(pivot).sort(compare);
  return left.concat(right);
}

export const makePathRank = (path) => {
  const pathRank  = { rank: 0, path: path, support: [] };
  for (const item of path.path.subgraph) {
    if (hasSupport(item)) {
      for (const supportPath of item.support) {
        pathRank.support.push(makePathRank(supportPath));
      }
    }
  }

  return pathRank;
}

export const updatePathRanks = (path, pathRank, pathFilters) => {
  const includeRank = -1;
  const excludeRank = 10000;
  path = path.path;
  for (const item of path.subgraph) {
    if (hasSupport(item)) {
      for (let i = 0; i < item.support.length; i++) {
        const supportPath = item.support[i];
        const supportRank = pathRank.support[i];
        updatePathRanks(supportPath, supportRank, pathFilters);
        if (supportRank.rank < 0) {
          pathRank.rank += supportRank.rank;
        }
      }
    } else {
      for (let ftr of pathFilters) {
        if (ftr.negated && path.tags[ftr.id] !== undefined) {
          pathRank.rank = excludeRank;
        } else if (!ftr.negated && path.tags[ftr.id] !== undefined) {
          pathRank.rank += includeRank;
        }
      }
    }
  }
}

export const pathRankSort = (pathRanks) => {
  for (let pathRank of pathRanks) {
    if (pathRank.support.length > 1) {
      pathRankSort(pathRank.support);
    }
  }

  pathRanks.sort(pathRankCompare);
}

const pathRankCompare = (a, b) => {
  if (b === undefined) return -1;
  return a.rank - b.rank;
}
