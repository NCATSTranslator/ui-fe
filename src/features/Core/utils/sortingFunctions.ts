import { getPathCount, getStringNameFromPath, getDefaultEdge } from '@/features/Core/utils/resultHelpers';
import { getEvidenceCounts, calculateTotalEvidence } from '@/features/Evidence/utils/utilities';
import { EdgeRank, Path, PathRank, RankedEdge, RankedPath, Result, ResultEdge, ResultNode, ResultSet, ScoreWeights } from '@/features/ResultList/types/results';
import { Filter, FilterFamily } from '@/features/ResultFiltering/types/filters';
import { Provenance, PublicationObject } from '@/features/Evidence/types/evidence';
import { generateScore, type ScorePair } from '@/features/ResultList/utils/scoring';
import { getFilterFamily, getTagFamily, isEvidenceFilter, FILTERING_CONSTANTS } from '@/features/ResultFiltering/utils/filterFunctions';
import { getEdgeById, getNodeById, getPathById } from '@/features/ResultList/slices/resultsSlice';
import { isNodeIndex } from '@/features/ResultList/utils/resultsInteractionFunctions';

const compareWithFallback = (
  aValue: string | undefined | null,
  bValue: string | undefined | null,
  direction: 'asc' | 'desc'
): number => {
  const aText = aValue?.trim();
  const bText = bValue?.trim();

  if (!aText && !bText) return 0;
  if (!aText) return 1;
  if (!bText) return -1;

  return direction === 'asc'
    ? aText.localeCompare(bText)
    : bText.localeCompare(aText);
}

export const sortNameLowHigh = (items: Result[]) => {
  return items.sort((a, b) => compareWithFallback(a.drug_name, b.drug_name, 'asc'));
};

export const sortNameHighLow = (items: Result[]) => {
  return items.sort((a, b) => compareWithFallback(a.drug_name, b.drug_name, 'desc'));
};

export const sortTitleLowHigh = (items: PublicationObject[]) => {
  return items.sort((a, b) => compareWithFallback(a.title, b.title, 'asc'));
};

export const sortTitleHighLow = (items: PublicationObject[]) => {
  return items.sort((a, b) => compareWithFallback(a.title, b.title, 'desc'));
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
    const aScore: ScorePair = (!!a?.score) ? a.score as ScorePair : generateScore(a.scores, scoreWeights.confidenceWeight, scoreWeights.noveltyWeight, scoreWeights.clinicalWeight);
    const bScore: ScorePair = (!!b?.score) ? b.score as ScorePair : generateScore(b.scores, scoreWeights.confidenceWeight, scoreWeights.noveltyWeight, scoreWeights.clinicalWeight);
    if (aScore.main === bScore.main)
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
    const aScore: ScorePair = (!!a?.score) ? a.score as ScorePair : generateScore(a.scores, scoreWeights.confidenceWeight, scoreWeights.noveltyWeight, scoreWeights.clinicalWeight);
    const bScore: ScorePair = (!!b?.score) ? b.score as ScorePair : generateScore(b.scores, scoreWeights.confidenceWeight, scoreWeights.noveltyWeight, scoreWeights.clinicalWeight);
    if (aScore.main === bScore.main)
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
  return (a: Provenance, b: Provenance) => { return (a[k] ?? '').localeCompare(b[k] ?? '') };
}

// Returns a shallow copy of an array sorted independently on the left and right side of the pivot point
export const pivotSort = <T>(arr: T[], pivot: number, compare: (a: T, b: T) => number): T[] => {
  const left = arr.slice(0, pivot).sort(compare);
  const right = arr.slice(pivot).sort(compare);
  return left.concat(right);
}

export const makePathRank = (path: Path): PathRank => {
  return { rank: 0, path: path };
}

interface PathRankingContext {
  resultSet: ResultSet;
  evidenceFilters: Filter[];
  otherFilters: Filter[];
  hasAraInclusion: boolean;
}

const INCLUDE_RANK_BASE = -1;
const EXCLUDE_RANK_BASE = 1;

/**
 * Returns the first negated filter that excludes this path, or null.
 * Preserves the ARA exemption: negated ARA filters are ignored when an ARA inclusion is active.
 */
export const getExcludingFilter = (
  path: Path,
  negatedFilters: Filter[],
  hasAraInclusion: boolean
): Filter | null => {
  for (const ftr of negatedFilters) {
    if (ftr.negated && ftr.id && path.tags[ftr.id] !== undefined) {
      if (getFilterFamily(ftr) === FILTERING_CONSTANTS.FAMILIES.ARA && hasAraInclusion) continue;
      return ftr;
    }
  }
  return null;
};

function _applyPathExclusion(ctx: PathRankingContext, path: Path, pathRank: PathRank): boolean {
  const negatedFilters = ctx.otherFilters.filter((ftr) => ftr.negated);
  const excludingFilter = getExcludingFilter(path, negatedFilters, ctx.hasAraInclusion);
  if (excludingFilter) {
    pathRank.rank = EXCLUDE_RANK_BASE * (
      excludingFilter.excludeWeight ? excludingFilter.excludeWeight : FILTERING_CONSTANTS.WEIGHT.HEAVY
    );
    return true;
  }
  return false;
}

function _applyEvidenceFiltering(path: Path, evidenceFilters: Filter[], pathRank: PathRank): boolean {
  if (evidenceFilters.length === 0) return false;

  for (const ftr of evidenceFilters) {
    if (ftr.negated && ftr.id && path.tags[ftr.id] !== undefined) {
      pathRank.rank = EXCLUDE_RANK_BASE * (
        ftr.excludeWeight ? ftr.excludeWeight : FILTERING_CONSTANTS.WEIGHT.HEAVY
      );
      return true;
    }
  }

  const inclusionFilters = evidenceFilters.filter((ftr) => !ftr.negated);
  if (inclusionFilters.length > 0) {
    const hasMatch = inclusionFilters.some(
      (ftr) => ftr.id && path.tags[ftr.id] !== undefined
    );
    if (!hasMatch) {
      pathRank.rank = EXCLUDE_RANK_BASE * FILTERING_CONSTANTS.WEIGHT.HEAVY;
      return true;
    }
    pathRank.rank += INCLUDE_RANK_BASE * FILTERING_CONSTANTS.WEIGHT.LIGHT;
  }

  return false;
}

function _applyInclusionFiltering(ctx: PathRankingContext, path: Path, pathRank: PathRank): void {
  let include = true;
  let lastFamily = null;
  for (const ftr of ctx.otherFilters) {
    if (!ftr.negated && ftr.id) {
      const currentFamily = getFilterFamily(ftr);
      if (currentFamily !== lastFamily) {
        if (!include) break;
        include = (path.tags[ftr.id] !== undefined);
        lastFamily = currentFamily;
      } else {
        include ||= (path.tags[ftr.id] !== undefined);
      }
    }
    if (include) {
      pathRank.rank += INCLUDE_RANK_BASE * FILTERING_CONSTANTS.WEIGHT.LIGHT;
    }
  }
  if (!include) {
    pathRank.rank = EXCLUDE_RANK_BASE * FILTERING_CONSTANTS.WEIGHT.HEAVY;
  }
}

function _updatePathRanks(ctx: PathRankingContext, path: Path, pathRank: PathRank): void {
  if (_applyPathExclusion(ctx, path, pathRank)) return;

  if (_applyEvidenceFiltering(path, ctx.evidenceFilters, pathRank)) return;

  _applyInclusionFiltering(ctx, path, pathRank);
}

export const updatePathRanks = (resultSet: ResultSet, path: Path, pathRank: PathRank, pathFilters: Filter[]) => {
  if (pathFilters.length === 0) return;
  const evidenceFilters: Filter[] = [];
  const otherFilters: Filter[] = [];

  for (const ftr of pathFilters) {
    if (isEvidenceFilter(ftr)) {
      evidenceFilters.push(ftr);
    } else {
      otherFilters.push(ftr);
    }
  }

  otherFilters.sort(filterCompare);

  const ctx: PathRankingContext = {
    resultSet,
    evidenceFilters,
    otherFilters,
    hasAraInclusion: otherFilters.some(
      (ftr) => !ftr.negated && getFilterFamily(ftr) === FILTERING_CONSTANTS.FAMILIES.ARA
    ),
  };

  _updatePathRanks(ctx, path, pathRank);
}

export const pathRankSort = (pathRanks: PathRank[]) => {
  pathRanks.sort(pathRankCompare);
}

export const makeEdgeRank = (edgeID: string): EdgeRank => {
  return { rank: 0, edgeID: edgeID };
}

/**
 * Ranks a single edge against the active edge filters.
 *
 * @param {ResultEdge} edge - The edge to rank.
 * @param {Filter[]} edgeFilters - The active edge filters.
 * @param {EdgeRank} edgeRank - Mutable rank record for this edge.
 */
export const updateEdgeRank = (edge: ResultEdge, edgeFilters: Filter[], edgeRank: EdgeRank) => {
  if (edgeFilters.length === 0) return;

  for (const ftr of edgeFilters) {
    if (ftr.negated && ftr.id && edge.tags[ftr.id] !== undefined) {
      edgeRank.rank = EXCLUDE_RANK_BASE * (ftr.excludeWeight ? ftr.excludeWeight : FILTERING_CONSTANTS.WEIGHT.HEAVY);
      return;
    }
  }

  const inclusionsByFamily = new Map<FilterFamily, Filter[]>();
  for (const ftr of edgeFilters) {
    if (ftr.negated || !ftr.id) continue;
    const family = getFilterFamily(ftr);
    const group = inclusionsByFamily.get(family);
    if (group) group.push(ftr);
    else inclusionsByFamily.set(family, [ftr]);
  }

  for (const group of inclusionsByFamily.values()) {
    const matchCount = group.filter((ftr) => edge.tags[ftr.id as string] !== undefined).length;
    if (matchCount === 0) {
      edgeRank.rank = EXCLUDE_RANK_BASE * FILTERING_CONSTANTS.WEIGHT.HEAVY;
      return;
    }
    edgeRank.rank += INCLUDE_RANK_BASE * matchCount * FILTERING_CONSTANTS.WEIGHT.LIGHT;
  }
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
    provenance: [""],
    signature: "",
    source_time: "",
    synonyms: [],
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
