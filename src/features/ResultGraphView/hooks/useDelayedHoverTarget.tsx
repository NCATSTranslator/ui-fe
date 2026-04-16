import { useState, useEffect } from 'react';
import { GraphHoverTarget } from '@/features/ResultGraphView/types/graphTypes';
import { sameTarget } from '@/features/ResultGraphView/utils/graphFunctions';

const TOOLTIP_SHOW_DELAY_MS = 250;
const TOOLTIP_HIDE_DELAY_MS = 100;

interface UseDelayedHoverTargetOptions {
  hold?: boolean;
}

export const useDelayedHoverTarget = (
  pending: GraphHoverTarget,
  { hold = false }: UseDelayedHoverTargetOptions = {}
): GraphHoverTarget => {
  const [visible, setVisible] = useState<GraphHoverTarget>(null);

  useEffect(() => {
    if (sameTarget(pending, visible)) return;
    if (hold && pending === null && visible !== null) return;
    const delay = visible === null ? TOOLTIP_SHOW_DELAY_MS : TOOLTIP_HIDE_DELAY_MS;
    const timer = setTimeout(() => setVisible(pending), delay);
    return () => clearTimeout(timer);
  }, [pending, visible, hold]);

  return visible;
};
