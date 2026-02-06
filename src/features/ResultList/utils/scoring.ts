import { equal, larger, format, polynomialRoot, largerEq, min, max, round, isComplex, type Complex } from 'mathjs';
import { getPathById } from '@/features/ResultList/slices/resultsSlice';
import { Path, Result, ResultSet, Score } from '@/features/ResultList/types/results.d';

export interface ScorePair {
  main: number;
  secondary: number;
}

type WeightSets = Record<string, number>;

export const generateScore = (
  scoreComponents: Score[],
  confidenceWeight: number,
  noveltyWeight: number,
  clinicalWeight: number
): ScorePair => {
  return maxSugenoScore(scoreComponents, confidenceWeight, noveltyWeight, clinicalWeight);
};

export const generatePathfinderScore = (resultSet: ResultSet | null, result: Result): ScorePair => {
  const pathObjOne: Path | null = (typeof result.paths[0] === 'string')
    ? getPathById(resultSet, result.paths[0])
    : result.paths[0];
  const pathObjTwo: Path | null = (result.paths.length > 1)
    ? (typeof result.paths[1] === 'string') ? getPathById(resultSet, result.paths[1]) : result.paths[1]
    : null;
  const score: ScorePair = {
    main: (pathObjOne) ? getPathfinderMetapathScore(pathObjOne) : 0,
    secondary: (pathObjTwo) ? getPathfinderMetapathScore(pathObjTwo) : 0
  };
  return score;
};

export const displayScore = (score: ScorePair | number, decimalPlaces: number = 2): string => {
  return format((typeof score === "number") ? score || 0 : score.main || 0, {notation: 'fixed', precision: decimalPlaces});
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

const maxSugenoScore = (
  scoreComponents: Score[],
  confidenceWeight: number,
  noveltyWeight: number,
  clinicalWeight: number
): ScorePair => {
  const sugenoPairs: ScorePair[] = scoreComponents.map((s) => {
    const scaledSugenoScore = 5 * computeSugeno(s.confidence, s.novelty, s.clinical_evidence,
      confidenceWeight, noveltyWeight, clinicalWeight);
    return {
      main: scaledSugenoScore,
      secondary: computeWeightedMean(s.confidence, s.novelty, s.clinical_evidence,
        confidenceWeight, noveltyWeight, clinicalWeight)
    };
  });

  return maxScorePair(sugenoPairs);
};

const maxScorePair = (scorePairs: ScorePair[]): ScorePair => {
  let maxScore: ScorePair = scorePairs[0];
  for (let i = 1; i < scorePairs.length; i++) {
    if (larger(scorePairs[i].main, maxScore.main) ||
        (equal(scorePairs[i].main, maxScore.main) &&
         larger(scorePairs[i].secondary, maxScore.secondary))) {
      maxScore = scorePairs[i];
    }
  }

  return maxScore;
};

const computeSugeno = (
  confidence: number,
  novelty: number,
  clinical: number,
  confidenceWeight: number,
  noveltyWeight: number,
  clinicalWeight: number
): number => {
  const a = confidenceWeight;
  const b = noveltyWeight;
  const c = clinicalWeight;
  const solutions = polynomialRoot(a+b+c-1, a*b+a*c+b*c, a*b*c);
  let lambda: number = 0;
  solutions.forEach((s) => {
    let val: number;
    if (isComplex(s)) {
      val = (s as Complex).re;
    } else {
      val = s as number;
    }

    if (!(equal(val, 0)) && largerEq(val, -1)) {
      lambda = val;
    }
  });

  const weightSets = computeWeightSets(lambda, a, b, c, 3);
  const allScores: { id: string; score: number }[] = [
    {id: 'co', score: confidence},
    {id: 'no', score: novelty},
    {id: 'cl', score: clinical}
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
    mins.push(min(allScores[i].score, weightsSorted[weightKeys[i]]));
  }

  // Sugeno score
  return max(...mins);
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
      ws[t] = round(ws[tl] + ws[tf] + (lambda * ws[tl] * ws[tf]), 2) as number;
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

const computeWeightedMean = (
  confidence: number,
  novelty: number,
  clinical: number,
  confidenceWeight: number,
  noveltyWeight: number,
  clinicalWeight: number
): number => {
  return (confidence * confidenceWeight) + (novelty * noveltyWeight) + (clinical * clinicalWeight);
};

export const getPathfinderMetapathScore = (path: Path): number => {
  // Pathfinder score is scaled to 0-5, original score is 0-1
  return path.score ? path.score * 5 : 0;
};
