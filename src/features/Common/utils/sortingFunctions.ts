import { equal } from 'mathjs';
import { getPathCount, hasSupport, isPathIndirectEdge, getStringNameFromPath, getDefaultEdge } from '@/features/Common/utils/utilities';
import { getEvidenceCounts, isPublicationObjectArray, calculateTotalEvidence } from '@/features/Evidence/utils/utilities';
import { Path, PathRank, RankedEdge, RankedPath, Result, ResultEdge, ResultNode, ResultSet, ScoreWeights } from '@/features/ResultList/types/results';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { Provenance, PublicationObject } from '@/features/Evidence/types/evidence';
import { generateScore } from '@/features/ResultList/utils/scoring';
import { getFilterFamily, getTagFamily, isEvidenceFilter, CONSTANTS } from '@/features/ResultFiltering/utils/filterFunctions';
import { getEdgeById, getNodeById, getPathById } from '@/features/ResultList/slices/resultsSlice';
import { isNodeIndex } from '@/features/ResultList/utils/resultsInteractionFunctions';

const compareWithFallback = (
  aValue: string | undefined | null,
  bValue: string | undefined | null,
  direction: 'asc' | 'desc'
): number => {
  const aText = aValue?.trim();
  const bText = bValue?.trim();

  const aHas = !!aText;
  const bHas = !!bText;

  if (!aHas && !bHas) return 0;
  if (!aHas) return 1;
  if (!bHas) return -1;

  return direction === 'asc'
    ? aText!.localeCompare(bText!)
    : bText!.localeCompare(aText!);
}

export const sortNameLowHigh = (items: Result[] | PublicationObject[]) => {
  return isPublicationObjectArray(items)
    ? items.sort((a, b) => compareWithFallback(a.title, b.title, 'asc'))
    : items.sort((a, b) => compareWithFallback(a.drug_name, b.drug_name, 'asc'));
};

export const sortNameHighLow = (items: Result[] | PublicationObject[]) => {
  return isPublicationObjectArray(items)
    ? items.sort((a, b) => compareWithFallback(a.title, b.title, 'desc'))
    : items.sort((a, b) => compareWithFallback(a.drug_name, b.drug_name, 'desc'));
};

export const sortJournalLowHigh = (items: PublicationObject[]) => {
  return items.sort((a, b) => compareWithFallback(a.journal, b.journal, 'asc'));
};

export const sortJournalHighLow = (items: PublicationObject[]) => {
  return items.sort((a, b) => compareWithFallback(a.journal, b.journal, 'desc'));
};

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

export const sortScoreLowHigh = (items: Result[], scoreWeights: ScoreWeights) => {
  return items.sort((a: Result, b: Result) => {
    const aScore = (!!a?.score) ? a.score : generateScore(a.scores, scoreWeights.confidenceWeight, scoreWeights.noveltyWeight, scoreWeights.clinicalWeight);
    const bScore = (!!b?.score) ? b.score : generateScore(b.scores, scoreWeights.confidenceWeight, scoreWeights.noveltyWeight, scoreWeights.clinicalWeight);
    if (equal(aScore.main, bScore.main))
      return aScore.secondary - bScore.secondary;

    return aScore.main - bScore.main;
  });
}

export const sortScorePathfinderLowHigh = (resultSet: ResultSet, items: Result[]) => {
  return items.sort((a: Result, b: Result) => {
    const aScore = (!!a?.score) ? a.score : 0;
    const bScore = (!!b?.score) ? b.score : 0;
    return (typeof aScore === "number" ? aScore : aScore.main) - (typeof bScore === "number" ? bScore : bScore.main);
  });
}

export const sortScoreHighLow = (items: Result[], scoreWeights: ScoreWeights) => {
  return items.sort((a: Result, b: Result) => {
    const aScore = (!!a?.score) ? a.score : generateScore(a.scores, scoreWeights.confidenceWeight, scoreWeights.noveltyWeight, scoreWeights.clinicalWeight);
    const bScore = (!!b?.score) ? b.score : generateScore(b.scores, scoreWeights.confidenceWeight, scoreWeights.noveltyWeight, scoreWeights.clinicalWeight);
    if (equal(aScore.main, bScore.main))
      return bScore.secondary - aScore.secondary;

    return bScore.main - aScore.main;
  });
}

export const sortScorePathfinderHighLow = (resultSet: ResultSet, items: Result[]) => {
  return items.sort((a: Result, b: Result) => {
    const aScore = (!!a?.score) ? a.score : 0;
    const bScore = (!!b?.score) ? b.score : 0;
    return (typeof bScore === "number" ? bScore : bScore.main) - (typeof aScore === "number" ? aScore : aScore.main);
  });
}

export const sortByEntityStrings = (items: Result[], strings: string[]) => {
  return items.sort((a: Result) => {
    const nameA = a.drug_name.toLowerCase();
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
    const aDate = (!a?.pubdate) ? failYear : Number(a.pubdate);
    const bDate = (!b?.pubdate) ? failYear : Number(b.pubdate);
    return (aDate - bDate);
  });
}

export const sortDateYearHighLow = (items: PublicationObject[]) => {
  const failYear = 0; // Ensure all invalid dates are sent to the end
  return items.sort((a: PublicationObject, b: PublicationObject) => {
    const aDate = (!a?.pubdate) ? failYear : Number(a.pubdate);
    const bDate = (!b?.pubdate) ? failYear : Number(b.pubdate);
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
  const f1Family = getTagFamily(filter1.id || '');
  const f2Family = getTagFamily(filter2.id || '');
  return f2Family.localeCompare(f1Family);
}

export const compareByKeyLexographic = (k: keyof Provenance) => {
  return (a: Provenance, b: Provenance) => { return a[k].localeCompare(b[k]) };
}

// Returns a shallow copy of an array sorted independently on the left and right side of the pivot point
export const pivotSort = <T>(arr: T[], pivot: number, compare: (a: T, b: T) => number): T[] => {
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
  if (pathFilters.length === 0) return;
  const includeRankBase = -1;
  const excludeRankBase = 1;
  const evidenceFilters = [];
  const otherFilters = [];

  for (const ftr of pathFilters) {
    if (isEvidenceFilter(ftr)) {
      evidenceFilters.push(ftr);
    } else {
      otherFilters.push(ftr);
    }
  }
  _updatePathRanks(resultSet, path, pathRank, evidenceFilters, otherFilters);

  function _updatePathRanks(resultSet: ResultSet, path: Path, pathRank: PathRank,
      evidenceFilters: Filter[], otherFilters: Filter[]) {
    // Apply exclusion first
    const isIndirectEdge = isPathIndirectEdge(resultSet, path);
    if (!isIndirectEdge) {
      for (const ftr of otherFilters) {
        if (ftr.negated && ftr.id && path.tags[ftr.id] !== undefined) {
          pathRank.rank = excludeRankBase * (ftr.excludeWeight ? ftr.excludeWeight : CONSTANTS.WEIGHT.HEAVY);
          return;
        }
      }
    }
    // Next apply edge level and indirect edge filtering
    const edgeRanks = [];
    for (let i = 1; i < path.subgraph.length; i += 2) {
      const edge = getEdgeById(resultSet, path.subgraph[i]);
      if (!edge) {
        console.warn(`_updatePathRanks: found undefined or null edge in path: ${path}`);
        continue;
      };
      if (hasSupport(edge)) {
        const supportRanks = [];
        for (const [j, sp] of edge.support.entries()) {
          const supportPath = (typeof sp === "string") ? getPathById(resultSet, sp) : sp;
          const supportRank = pathRank.support[j];
          if (!supportPath) {
            console.warn(`_updatePathRanks: found undefined or null support path in edge: ${edge}`);
            continue;
          }
          _updatePathRanks(resultSet, supportPath, supportRank, evidenceFilters, otherFilters);
          if (supportRank && supportRank.rank !== undefined && supportRank.rank !== null) {
            supportRanks.push(supportRank.rank);
          }
        }
        const nonExcludedRanks = supportRanks.filter(rank => rank <= 0)
        if (nonExcludedRanks.length === 0) {
          pathRank.rank = excludeRankBase * CONSTANTS.WEIGHT.HEAVY;
          return;
        } else {
          const totalSupportRank = nonExcludedRanks.reduce((acc: number, rank: number): number => {
            return rank + acc;
          }, 0);
          edgeRanks.push(includeRankBase * totalSupportRank * CONSTANTS.WEIGHT.LIGHT);
        }
      } else {
        edgeRanks.push(_calcEdgeRank(edge, evidenceFilters));
      }
    }
    // Determine if path should be filtered by edge ranks
    let edgesUnmatched = true;
    for (const rank of edgeRanks) {
      if (rank > 0) {
        pathRank.rank = excludeRankBase * CONSTANTS.WEIGHT.HEAVY;
        return;
      }
      edgesUnmatched = edgesUnmatched && rank === 0;
      pathRank.rank += rank;
    }
    if (edgesUnmatched && evidenceFilters.some(ftr => !ftr.negated)) {
      pathRank.rank = excludeRankBase * CONSTANTS.WEIGHT.HEAVY;
      return;
    }
    if (isIndirectEdge) return;
    // Finally apply inclusion based on other filters
    otherFilters.sort();
    let include = true;
    let lastFamily = null;
    for (let ftr of otherFilters) {
      if (!ftr.negated && ftr.id) { // Exclusion was handled above
        let currentFamily = getFilterFamily(ftr);
        if (currentFamily !== lastFamily) {
          include &&= (path.tags[ftr.id] !== undefined);
          lastFamily = currentFamily;
        } else {
          include ||= (path.tags[ftr.id] !== undefined);
        }
      }
      if (include) {
        pathRank.rank += includeRankBase * CONSTANTS.WEIGHT.LIGHT;
      }
    }
    if (!include) {
      pathRank.rank = excludeRankBase * CONSTANTS.WEIGHT.HEAVY;
    }
  }

  // Only remove edges if there is a matching exclusion filter and no matching inclusion filters
  function _calcEdgeRank(edge: ResultEdge, evidenceFilters: Filter[]): number {
    let edgeRank = 0;
    for (const ftr of evidenceFilters) {
      if (ftr.id && edge.tags[ftr.id] !== undefined) {
        if (!ftr.negated) return -1;
        edgeRank = 1;
      }
    }
    return edgeRank;
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
    id: "",
    names: [],
    other_names: {},
    provenance: "",
    annotations: {
      chemical: {
        approval: null,
        clinical_trials: null,
        descriptions: null,
        indications: null,
        otc_status: null,
        other_names: null,
        roles: null
      },
      disease: {
        curies: null,
        descriptions: null
      },
      gene: {
        descriptions: null,
        name: null,
        species: null,
        tdl: null
      }
    },
    tags: {},
    types: [],
  };

  const transformedSubgraph = path.subgraph.map((id, i) => {
    if(isNodeIndex(i)) {
      const node = getNodeById(resultSet, id);
      return node || defaultNode;
    } else {
      const edge = getEdgeById(resultSet, id) || getDefaultEdge(undefined);
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
