import { polynomialRoot, isComplex, type Complex } from 'mathjs';
import { getPathById } from '@/features/ResultList/slices/resultsSlice';
import { Path, Result, ResultSet, Score, ScoreWeights } from '@/features/ResultList/types/results.d';

export interface ScorePair {
  main: number;
  secondary: number;
}

type WeightSets = Record<string, number>;

// Toggles the result score source. Set to `true` to score results by their
// confidence value, or `false` to use the legacy Sugeno calculation (kept
// below in case we revert). Affects default score sorting across the app.
const USE_CONFIDENCE_SCORE = true;

export const generateScore = (
  scoreComponents: Score[],
  confidenceWeight: number,
  noveltyWeight: number,
  clinicalWeight: number
): ScorePair => {
  if (USE_CONFIDENCE_SCORE)
    return maxConfidenceScore(scoreComponents);
  
  return maxSugenoScore(scoreComponents, confidenceWeight, noveltyWeight, clinicalWeight);
};

const resolvePath = (resultSet: ResultSet | null, path: string | Path): Path | null =>
  (typeof path === 'string') ? getPathById(resultSet, path) : path;

export const generatePathfinderScore = (resultSet: ResultSet | null, result: Result): ScorePair => {
  const pathObjOne: Path | null = resolvePath(resultSet, result.paths[0]);
  const pathObjTwo: Path | null = (result.paths.length > 1) ? resolvePath(resultSet, result.paths[1]) : null;
  const score: ScorePair = {
    main: (pathObjOne) ? getPathfinderMetapathScore(pathObjOne) : 0,
    secondary: (pathObjTwo) ? getPathfinderMetapathScore(pathObjTwo) : 0
  };
  return score;
};

export const displayScore = (score: ScorePair | number, decimalPlaces: number = 2): string => {
  const value = (typeof score === "number") ? score || 0 : score.main || 0;
  return value.toFixed(decimalPlaces);
};

export const maxNormalizedScore = (scoreComponents: Score[]): ScorePair => {
  const normalizedScorePairs: ScorePair[] = scoreComponents.map((s) => {
    const scaledNormalizedScore = 5 * s.normalized_score / 100;
    return {
      main: scaledNormalizedScore,
      secondary: scaledNormalizedScore
    };
  });

  return maxScorePair(normalizedScorePairs);
};

const maxConfidenceScore = (scoreComponents: Score[]): ScorePair => {
  const confidencePairs: ScorePair[] = scoreComponents.map((s) => {
    const scaledConfidence = 5 * s.confidence;
    return {
      main: scaledConfidence,
      secondary: scaledConfidence,
    };
  });

  return maxScorePair(confidencePairs);
};

const maxSugenoScore = (
  scoreComponents: Score[],
  confidenceWeight: number,
  noveltyWeight: number,
  clinicalWeight: number
): ScorePair => {
  const weights: SugenoWeights = { confidenceWeight, noveltyWeight, clinicalWeight };
  const sugenoPairs: ScorePair[] = scoreComponents.map((s) => ({
    main: 5 * computeSugeno(s, weights),
    secondary: computeWeightedMean(s, weights),
  }));

  return maxScorePair(sugenoPairs);
};

const maxScorePair = (scorePairs: ScorePair[]): ScorePair => {
  if (scorePairs.length === 0) return { main: 0, secondary: 0 };
  let maxScore: ScorePair = scorePairs[0];
  for (let i = 1; i < scorePairs.length; i++) {
    if (scorePairs[i].main > maxScore.main ||
        (scorePairs[i].main === maxScore.main &&
         scorePairs[i].secondary > maxScore.secondary)) {
      maxScore = scorePairs[i];
    }
  }

  return maxScore;
};

type SugenoWeights = Pick<ScoreWeights, 'confidenceWeight' | 'noveltyWeight' | 'clinicalWeight'>;

const solveSugenoLambda = (a: number, b: number, c: number): number => {
  // When fewer than 2 weights are non-zero, the polynomial coefficients are all zero
  // and polynomialRoot cannot solve. Lambda = 0 is the correct degenerate case
  // (additive fuzzy measure), so skip the root-finding.
  const c0 = a + b + c - 1;
  const c1 = a * b + a * c + b * c;
  const c2 = a * b * c;
  if (c0 === 0 && c1 === 0 && c2 === 0) return 0;

  let lambda = 0;
  polynomialRoot(c0, c1, c2).forEach((s) => {
    const val = isComplex(s) ? (s as Complex).re : s as number;
    if (val !== 0 && val >= -1) {
      lambda = val;
    }
  });
  return lambda;
};

const computeSugeno = (s: Score, weights: SugenoWeights): number => {
  const { confidenceWeight: a, noveltyWeight: b, clinicalWeight: c } = weights;
  const lambda = solveSugenoLambda(a, b, c);
  const weightSets = computeWeightSets(lambda, a, b, c, 3);
  const allScores: { id: string; score: number }[] = [
    {id: 'co', score: s.confidence},
    {id: 'no', score: s.novelty},
    {id: 'cl', score: s.clinical_evidence}
  ];

  allScores.sort((a, b) => {
    return b.score - a.score;
  });

  const weightsSorted: WeightSets = {};
  let k = '';
  for (const score of allScores) {
    k = `${k}${score.id}`;
    weightsSorted[k] = weightSets[k];
  }

  const weightKeys = Object.keys(weightsSorted);
  const mins: number[] = [];
  for (let i = 0; i < weightKeys.length; ++i) {
    mins.push(Math.min(allScores[i].score, weightsSorted[weightKeys[i]]));
  }

  // Sugeno score
  return Math.max(...mins);
};

const computeWeightSets = (
  lambda: number,
  confidenceWeight: number,
  noveltyWeight: number,
  clinicalWeight: number,
  n: number = 2
): WeightSets => {
  const ws: WeightSets = {
    'co': confidenceWeight,
    'no': noveltyWeight,
    'cl': clinicalWeight
  };
  const factors = Object.keys(ws);
  for (let i = 2; i < n+1; ++i) {
    const permutations = getPermutations(factors, i);
    for (const p of permutations) {
      let t = '';
      let tl = '';
      let tf = '';
      for (let j = 0; j < p.length; ++j) {
        t = `${t}${p[j]}`;
        if (j < i-1) {
          tl = `${tl}${p[j]}`;
        }

        if (j === i-1) {
          tf = `${tf}${p[j]}`;
        }
      }
      ws[t] = Math.round((ws[tl] + ws[tf] + (lambda * ws[tl] * ws[tf])) * 100) / 100;
    }
  }

  return ws;
};

const getPermutations = (array: string[], n: number): string[][] => {
  const permutations: string[][] = [];
  const ss = subsets(array, n);
  for (const subset of ss) {
    permutations.push(...permute(subset));
  }
  return permutations;
};

// Get all subsets of length n from array
const subsets = (array: string[], n: number): string[][] => {
  const m = array.length;
  const totalSubsets = 1 << m;
  const result: string[][] = [];
  for (let bitmask = 0; bitmask < totalSubsets; ++bitmask) {
    let count = 0;
    let temp = bitmask;
    while (temp > 0) {
      count += temp & 1;
      temp >>= 1;
    }

    if (count === n) {
      const subset: string[] = [];
      for (let i = 0; i < m; ++i) {
        if (bitmask & (1 << i)) {
          subset.push(array[i]);
        }
      }

      result.push(subset);
    }
  }

  return result;
};

// Heap's algorithm
const permute = (array: string[]): string[][] => {
  const permutations: string[][] = [];
  const arr = [...array];
  const n = array.length;
  const c = new Array(n).fill(0);

  permutations.push([...arr]);
  let i = 1;
  while (i < n) {
    if (c[i] < i) {
      if (i % 2 === 0) {
        swap(arr, 0, i);
      } else {
        swap(arr, c[i], i);
      }

      permutations.push([...arr]);
      c[i] += 1;
      // eslint-disable-next-line sonarjs/no-redundant-assignments -- false positive: i can exceed 1 here; Heap's algorithm resets it
      i = 1;
    } else {
      c[i] = 0;
      i += 1;
    }
  }

  return permutations;
};

const swap = (array: string[], i: number, j: number): void => {
  const temp = array[i];
  array[i] = array[j];
  array[j] = temp;
};

const computeWeightedMean = (s: Score, weights: SugenoWeights): number => {
  return (s.confidence * weights.confidenceWeight) + (s.novelty * weights.noveltyWeight) + (s.clinical_evidence * weights.clinicalWeight);
};

export const recalculateResultSetScores = (
  resultSet: ResultSet,
  weights: ScoreWeights,
  isPathfinder: boolean
): ResultSet => {
  return {
    ...resultSet,
    data: {
      ...resultSet.data,
      results: resultSet.data.results.map(result => ({
        ...result,
        score: isPathfinder
          ? generatePathfinderScore(resultSet, result)
          : generateScore(result.scores, weights.confidenceWeight, weights.noveltyWeight, weights.clinicalWeight),
      })),
    },
  };
};

export const getPathfinderMetapathScore = (path: Path): number => {
  // Pathfinder score is scaled to 0-5, original score is 0-1
  return path.score ? path.score * 5 : 0;
};
