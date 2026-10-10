import { useMemo } from 'react';
import { useWindowSize } from '@/features/Core/hooks/useWindowSize';

/** Matches the $breakpoint used by the result row layouts in SCSS. */
const DEFAULT_BREAKPOINT = 1240;

/**
 * Whether the viewport is narrower than a breakpoint.
 * @param {number} breakpoint - Width in pixels to compare against.
 * @returns {boolean} True while the window is below the breakpoint.
 */
export const useResponsiveBreakpoint = (breakpoint: number = DEFAULT_BREAKPOINT): boolean => {
  const { width } = useWindowSize();
  return useMemo(() => !!width && width < breakpoint, [width, breakpoint]);
};
