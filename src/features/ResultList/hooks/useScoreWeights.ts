import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ScoreWeights } from '@/features/ResultList/types/results';

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  confidenceWeight: 1.0,
  noveltyWeight: 0.1,
  clinicalWeight: 1.0,
};

export const NOVELTY_SCORE_WEIGHTS: ScoreWeights = {
  confidenceWeight: 0.1,
  noveltyWeight: 1.0,
  clinicalWeight: 0.1,
};

const TOGGLE_ANIMATION_MS = 300;

interface UseScoreWeightsOptions {
  /** Called after the toggle animation completes with the new weights.
   *  Use this to recalculate scores — avoids the need for a separate useEffect. */
  onWeightsChange?: (newWeights: ScoreWeights) => void;
}

interface UseScoreWeightsReturn {
  scoreWeights: ScoreWeights;
  noveltyBoost: boolean;
  handleToggleNoveltyBoost: (active: boolean) => void;
}

const useScoreWeights = (options: UseScoreWeightsOptions = {}): UseScoreWeightsReturn => {
  // Default to false until the user toggles the novelty boost
  const [noveltyBoost, setNoveltyBoost] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Store callback in a ref so the setTimeout always calls the latest version
  // without needing it as a dependency of useCallback
  const onWeightsChangeRef = useRef(options.onWeightsChange);
  onWeightsChangeRef.current = options.onWeightsChange;

  const scoreWeights = useMemo(() => noveltyBoost ? NOVELTY_SCORE_WEIGHTS : DEFAULT_SCORE_WEIGHTS, [noveltyBoost]);

  const handleToggleNoveltyBoost = useCallback((active: boolean) => {
    // Update state immediately so derived scoreWeights and refs stay consistent
    setNoveltyBoost(active);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Delay the heavy recalculation to let the toggle animation complete
    timeoutRef.current = setTimeout(() => {
      const newWeights = active ? NOVELTY_SCORE_WEIGHTS : DEFAULT_SCORE_WEIGHTS;
      onWeightsChangeRef.current?.(newWeights);
    }, TOGGLE_ANIMATION_MS);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { scoreWeights, noveltyBoost, handleToggleNoveltyBoost };
};

export default useScoreWeights;
