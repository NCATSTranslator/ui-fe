/**
 * Resolves after the browser has painted whatever state updates are pending.
 * Use it to push expensive work past the frame that shows the user's click landed.
 */
export const afterNextPaint = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

export const clampFixedPosition = (
  x: number,
  y: number,
  width: number,
  height: number,
  padding = 8,
): { x: number; y: number } => ({
  x: Math.max(padding, Math.min(x, window.innerWidth - width - padding)),
  y: Math.max(padding, Math.min(y, window.innerHeight - height - padding)),
});
