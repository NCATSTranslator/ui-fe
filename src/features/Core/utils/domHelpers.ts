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
