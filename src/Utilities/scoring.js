import * as math from 'mathjs';

export const maxSugenoScore = function(scores, confidenceWeight, noveltyWeight, clinicalWeight) {
  const scorePairs = scores.map((s) => {
    return {
      sugeno: computeSugeno(s.confidence, s.novelty, s.clinical_evidence,
        confidenceWeight, noveltyWeight, clinicalWeight),
      weightedMean: computeWeightedMean(s.confidence, s.novelty, s.clinical_evidence,
        confidenceWeight, noveltyWeight, clinicalWeight)
    };
  });

  let maxScore = scorePairs[0];
  for (let i = 1; i < maxScore.length; i++) {
    if (math.larger(scorePairs[i].sugeno, maxScore.sugeno) ||
        (math.equal(scorePairs[i].sugeno, maxScore.sugeno) &&
         math.larger(scorePairs[i].weightedMean, maxScore.weightedMean))) {
      maxScore = scorePairs[i];
    }
  }

  return maxScore;
}

export const displayScore = function(score, decimalPlaces=2) {
  return math.format(score, {notation: 'fixed', precision: decimalPlaces});
}

const computeSugeno = function(confidence, novelty, clinical,
    confidenceWeight, noveltyWeight, clinicalWeight) {
  const a = confidenceWeight;
  const b = noveltyWeight;
  const c = clinicalWeight;
  const solutions = math.polynomialRoot(a+b+c-1, a*b+a*c+b*c, a*b*c);
  let lambda = 0;
  solutions.forEach((s) => {
    if (isComplex(s)) {
      s = s.re;
    }

    if (!(math.equal(s, 0)) && math.largerEq(s, -1)) {
      lambda = s;
    }
  });

  const weightSets = computeWeightSets(lambda, a, b, c, 3);
  const allScores = [
    {id: 'co', score: confidence},
    {id: 'no', score: novelty},
    {id: 'cl', score: clinical}
  ];

  allScores.sort((a, b) => {
    return b.score - a.score;
  });

  const weightsSorted = {};
  let k = '';
  for (const score of allScores) {
    k = `${k}${score.id}`;
    weightsSorted[k] = weightSets[k];
  }

  const weightKeys = Object.keys(weightsSorted);
  const mins = [];
  for (let i = 0; i < weightKeys.length; ++i) {
    mins.push(math.min(allScores[i].score, weightsSorted[weightKeys[i]]));
  }

  // Sugeno score
  return math.max(...mins);
} 

const isComplex = function(x) {
  return (x instanceof math.Complex);
} 

const computeWeightSets = function(lambda, confidenceWeight, noveltyWeight, clinicalWeight, n=2) {
  const ws = {
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
      ws[t] = math.round(ws[tl] + ws[tf] + (lambda * ws[tl] * ws[tf]), 2);
    }
  }

  return ws;
}

const getPermutations = function(array, n) {
  const permutations = [];
  const ss = subsets(array, n);
  for (const subset of ss) {
    permutations.push(...permute(subset));
  }
  return permutations;
}

// Get all subsets of length n from array
const subsets = function(array, n) {
  const m = array.length;
  const totalSubsets = 1 << m;
  const subsets = [];
  for (let bitmask = 0; bitmask < totalSubsets; ++bitmask) {
    let count = 0;
    let temp = bitmask;
    while (temp > 0) {
      count += temp & 1;
      temp >>= 1;
    }

    if (count === n) {
      const subset = [];
      for (let i = 0; i < m; ++i) {
        if (bitmask & (1 << i)) {
          subset.push(array[i]);
        }
      }

      subsets.push(subset)
    }
  }

  return subsets;
}

// Heap's algorithm
const permute = function(array) {
  const permutations = [];
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
}

const swap = function(array, i, j) {
  const temp = array[i];
  array[i] = array[j];
  array[j] = temp;
}

const computeWeightedMean = function(confidence, novelty, clinical,
    confidenceWeight, noveltyWeight, clinicalWeight) {
  return (confidence * confidenceWeight) + (novelty * noveltyWeight) + (clinical * clinicalWeight);
}
