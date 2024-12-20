import { equal } from 'mathjs';
import { getEvidenceCounts, getPathCount, hasSupport, isPublicationObjectArray, calculateTotalEvidence, getStringNameFromPath } from './utilities';
import { Filter, Path, PathRank, RankedEdge, RankedPath, Result, ResultEdge, ResultNode, ResultSet } from '../Types/results.d';
import { PublicationObject } from '../Types/evidence.d';
import { generateScore } from './scoring';
import { getTagFamily } from './filterFunctions';
import { getEdgeById, getNodeById, getPathById } from '../Redux/resultsSlice';

// alphabetical order
export const sortNameLowHigh = (items: Result[] | PublicationObject[]) => {
  if(isPublicationObjectArray(items)) {
    return items.sort((a: PublicationObject, b: PublicationObject) => {
      const aTitle = (a?.title) ? a.title : "";
      const bTitle = (b?.title) ? b.title : "";
      return aTitle.localeCompare(bTitle);
    });
  } else {
    return items.sort((a: Result, b: Result) => a.drug_name.localeCompare(b.drug_name));
  }
}

// reverse alphabetical order
export const sortNameHighLow = (items: Result[] | PublicationObject[]) => {
  if(isPublicationObjectArray(items)) {
    return items.sort((a: PublicationObject, b: PublicationObject) => {
      const aTitle = (a?.title) ? a.title : "";
      const bTitle = (b?.title) ? b.title : "";
      return -aTitle.localeCompare(bTitle);
    });
  } else {
    return items.sort((a: Result, b: Result) => -a.drug_name.localeCompare(b.drug_name));
  }
}

// alphabetical order
export const sortJournalLowHigh = (items: PublicationObject[]) => {
  return items.sort((a: PublicationObject, b: PublicationObject) => {
    const aJournal = (a?.journal) ? a.journal : "";
    const bJournal = (b?.journal) ? b.journal : "";
    return aJournal.localeCompare(bJournal);
  });
}

// reverse alphabetical order
export const sortJournalHighLow = (items: PublicationObject[]) => {
  return items.sort((a: PublicationObject, b: PublicationObject) => {
    const aJournal = (a?.journal) ? a.journal : "";
    const bJournal = (b?.journal) ? b.journal : "";
    return -aJournal.localeCompare(bJournal);
  });
}

export const sortEvidenceLowHigh = (resultSet: ResultSet, items: Result[]) => {
  return items.sort((a: Result, b: Result) => {
    const aCount = (!!a?.evidenceCount)? a.evidenceCount : getEvidenceCounts(resultSet, a);
    const bCount = (!!b?.evidenceCount)? b.evidenceCount : getEvidenceCounts(resultSet, b);
    return calculateTotalEvidence(aCount) - calculateTotalEvidence(bCount);
  });
}

export const sortEvidenceHighLow = (resultSet: ResultSet, items: Result[]) => {
  return items.sort((a: Result, b: Result) => {
    const aCount = (!!a?.evidenceCount)? a.evidenceCount : getEvidenceCounts(resultSet, a);
    const bCount = (!!b?.evidenceCount)? b.evidenceCount : getEvidenceCounts(resultSet, b);
    return calculateTotalEvidence(bCount) - calculateTotalEvidence(aCount);
  });
}

export const sortPathsLowHigh = (resultSet: ResultSet, items: Result[]) => {
  return items.sort((a: Result, b: Result) => {
    const aCount = (!!a?.pathCount) ? a.pathCount : getPathCount(resultSet, a.paths);
    const bCount = (!!b?.pathCount) ? b.pathCount : getPathCount(resultSet, b.paths);
    return aCount - bCount;
  });
}

export const sortPathsHighLow = (resultSet: ResultSet, items: Result[]) => {
  return items.sort((a: Result, b: Result) => {
    const aCount = (!!a?.pathCount) ? a.pathCount : getPathCount(resultSet, a.paths);
    const bCount = (!!b?.pathCount) ? b.pathCount : getPathCount(resultSet, b.paths);
    return bCount - aCount;
  });}

export const sortScoreLowHigh = (items: Result[], scoreWeights: {confidenceWeight: number, noveltyWeight: number, clinicalWeight: number }) => {
  return items.sort((a: Result, b: Result) => {
    const aScore = (!!a?.score) ? a.score : generateScore(a.scores, scoreWeights.confidenceWeight, scoreWeights.noveltyWeight, scoreWeights.clinicalWeight);
    const bScore = (!!b?.score) ? b.score : generateScore(b.scores, scoreWeights.confidenceWeight, scoreWeights.noveltyWeight, scoreWeights.clinicalWeight);
    if (equal(aScore.main, bScore.main)) 
      return aScore.secondary - bScore.secondary;
    
    return aScore.main - bScore.main;
  });
}

export const sortScoreHighLow = (items: Result[], scoreWeights: {confidenceWeight: number, noveltyWeight: number, clinicalWeight: number }) => {
  return items.sort((a: Result, b: Result) => {
    const aScore = (!!a?.score) ? a.score : generateScore(a.scores, scoreWeights.confidenceWeight, scoreWeights.noveltyWeight, scoreWeights.clinicalWeight);
    const bScore = (!!b?.score) ? b.score : generateScore(b.scores, scoreWeights.confidenceWeight, scoreWeights.noveltyWeight, scoreWeights.clinicalWeight);
    if (equal(aScore.main, bScore.main)) 
      return bScore.secondary - aScore.secondary;
    
    return bScore.main - aScore.main;
  });
}

export const sortByEntityStrings = (items: any, strings: string[]) => {
  return items.sort((a: any, b: any) => {
    const nameA = a.name.toLowerCase();
    for(const string of strings) {
      if(nameA.includes(string.toLowerCase()))
        return -1;
    }
    return 1;
  });
}

export const sortSupportByEntityStrings = (resultSet: ResultSet, items: Path[], strings: string[]) => {
  return items.sort((a, b) => {
    const nameA = getStringNameFromPath(resultSet, a).toLowerCase();
    const nameB = getStringNameFromPath(resultSet, b).toLowerCase();

    const nameAIncludesString = strings.some(string => nameA.includes(string.toLowerCase()));
    const nameBIncludesString = strings.some(string => nameB.includes(string.toLowerCase()));

    if (nameAIncludesString && !nameBIncludesString) {
      return -1;
    }
    if (!nameAIncludesString && nameBIncludesString) {
      return 1;
    }

    // If both or neither include a string, sort by the length of subgraph
    const lengthA = a.subgraph.length;
    const lengthB = b.subgraph.length;

    return lengthA - lengthB;
  });
}

export const sortSupportByLength = (items: Path[]) => {
  return items.sort((a, b) => {
    if(!a?.subgraph.length || !b?.subgraph.length)
      return 1;
    return a.subgraph.length - b.subgraph.length;
  });
}

export const sortDateYearLowHigh = (items: PublicationObject[]) => {
  const failYear = 3000; // Ensure all invalid dates are sent to the end
  return items.sort((a: PublicationObject, b: PublicationObject) => {
    const aDate = (a.pubdate === null) ? failYear : Number(a.pubdate);
    const bDate = (b.pubdate === null) ? failYear : Number(b.pubdate);
    return (aDate - bDate);
  });
}

export const sortDateYearHighLow = (items: PublicationObject[]) => {
  const failYear = 0; // Ensure all invalid dates are sent to the end
  return items.sort((a: PublicationObject, b: PublicationObject) => {
    const aDate = (a.pubdate === null) ? failYear : Number(a.pubdate);
    const bDate = (b.pubdate === null) ? failYear : Number(b.pubdate);
    return (bDate - aDate);
  });
}

export const sortByNamePathfinderLowHigh = (items: Result[]) => {
  return items.sort(
    (a,b) => {
      const countSlashes = (str: string) => (str.match(/\//g) || []).length;

      const slashCountA = countSlashes(a.drug_name);
      const slashCountB = countSlashes(b.drug_name);

      // First, sort by the number of slashes
      if (slashCountA !== slashCountB) {
        return slashCountA - slashCountB;
      }

      // If the slash count is the same, sort alphabetically
      return a.drug_name.localeCompare(b.drug_name);
    }
  );
};

export const sortByNamePathfinderHighLow = (items: Result[]) => {
  return items.sort(
    (a,b) => {
      const countSlashes = (str: string) => (str.match(/\//g) || []).length;

      const slashCountA = countSlashes(a.drug_name);
      const slashCountB = countSlashes(b.drug_name);

      // First, sort by the number of slashes in reverse order (most slashes first)
      if (slashCountA !== slashCountB) {
        return slashCountB - slashCountA;
      }

      // If the slash count is the same, sort alphabetically in reverse order
      return b.drug_name.localeCompare(a.drug_name);
    }
  );
};

export const filterCompare = (filter1: Filter, filter2: Filter) => {
  const f1Family = getTagFamily(filter1.id);
  const f2Family = getTagFamily(filter2.id);
  return f2Family.localeCompare(f1Family);
}

export const compareByKeyLexographic = (k: any) => {
  return (a: any, b: any) => { return a[k].localeCompare(b[k]) };
}

// Returns a shallow copy of an array sorted independently on the left and right side of the pivot point
export const pivotSort = (arr: any[], pivot: number, compare: (a: any, b: any) => number) => {
  const left = arr.slice(0, pivot).sort(compare);
  const right = arr.slice(pivot).sort(compare);
  return left.concat(right);
}

export const makePathRank = (resultSet: ResultSet, path: Path) => {
  const pathRank: PathRank  = { rank: 0, path: path, support: [] };
  for (let i = 1; i < path.subgraph.length; i += 2) {
    const edge = getEdgeById(resultSet, path.subgraph[i]);
    if (!!edge && hasSupport(edge)) {
      for (const sp of edge.support) {
        const supportPath = (typeof sp === "string") ? getPathById(resultSet, sp): sp;
        if(!!supportPath)
          pathRank.support.push(makePathRank(resultSet, supportPath));
      }
    }
  }

  return pathRank;
}

export const updatePathRanks = (resultSet: ResultSet, path: Path, pathRank: PathRank, pathFilters: Filter[]) => {
  const includeRank = -1;
  const excludeRank = 10000;

  for (let i = 1; i < path.subgraph.length; i += 2) {
    const edge = getEdgeById(resultSet, path.subgraph[i]);
    if (!!edge && hasSupport(edge)) {
      for (const [j, sp] of edge.support.entries()) {
        const supportPath = (typeof sp === "string") ? getPathById(resultSet, sp) : sp;
        const supportRank = pathRank.support[j];
        // console.log(pathRank, i);
        if(!!supportPath) {
          updatePathRanks(resultSet, supportPath, supportRank, pathFilters);
          // console.log(supportRank);
          if (supportRank?.rank && supportRank.rank < 0) {
            pathRank.rank += supportRank.rank;
          }
        }
      }
    } else {
      for (let ftr of pathFilters) {
        if (ftr.negated && ftr.id && path.tags[ftr.id] !== undefined) {
          pathRank.rank = excludeRank;
        } else if (!ftr.negated && ftr.id && path.tags[ftr.id] !== undefined) {
          pathRank.rank += includeRank;
        }
      }
    }
  }
}

export const pathRankSort = (pathRanks: PathRank[]) => {
  for (let pathRank of pathRanks) {
    if (pathRank.support.length > 1) 
      pathRankSort(pathRank.support);
  }

  pathRanks.sort(pathRankCompare);
}

const pathRankCompare = (a: PathRank, b: PathRank) => {
  if (b === undefined) return -1;
  return a.rank - b.rank;
}

export const convertResultEdgeToRankedEdge = (resultSet: ResultSet, edge: ResultEdge): RankedEdge => {
  const convertSupportToRankedPaths = (support: (string | Path)[]): RankedPath[] => {
    return support.map((item) => {
      const path = typeof item === "string" ? getPathById(resultSet, item) : item;
      if (!path) {
        throw new Error(`Invalid path ID or missing Path object: ${item}`);
      }
      return convertPathToRankedPath(resultSet, path);
    });
  };

  const rankedSupport = convertSupportToRankedPaths(edge.support);

  return {
    ...edge,
    support: rankedSupport,
  };
}

export const convertPathToRankedPath = (resultSet: ResultSet, path: Path): RankedPath => {
  const defaultNode: ResultNode = {
    aras: [],
    curies: [],
    descriptions: [],
    names: [],
    other_names: {},
    provenance: "",
    species: null,
    tags: {},
    types: [],
  };

  const defaultEdge: ResultEdge = {
    aras: [],
    "is_root": false,
    knowledge_level: "unknown",
    object: "",
    predicate: "",
    predicate_url: "",
    provenance: [],
    publications: {},
    subject: "",
    support: [],
  };

  const transformedSubgraph = path.subgraph.map((id, i) => {
    if(i % 2 === 0) {
      const node = getNodeById(resultSet, id);
      return node || defaultNode; 
    } else {
      const edge = getEdgeById(resultSet, id) || defaultEdge;
      return convertResultEdgeToRankedEdge(resultSet, edge);
    }
  });

  // Return the converted object
  return {
    ...path,
    subgraph: transformedSubgraph,
  };
}

export const genRankedPaths = (resultSet: ResultSet | null, pathRanks: PathRank[]) => {
  if(!resultSet) {
    console.warn("no result set available to generate ranked paths.");
    return [];
  }

  return pathRanks.map((pr) => convertPathToRankedPath(resultSet, pr.path));
}

export const sortPathsByFilterState = (paths: Path[], pathFilterState: { [key: string]: boolean }): Path[] => {
  return paths.sort((a: Path, b: Path) => {
    const aState = pathFilterState[a.id || ""] ?? false; 
    const bState = pathFilterState[b.id || ""] ?? false; 

    // Keep original order if both have the same state
    if (aState === bState) 
      return 0; 
    
    return aState ? -1 : 1; 
  });
}