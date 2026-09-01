import { useCanvasSync, useCanvasSyncReconcile } from '@/features/Canvas/hooks/useCanvasSync';

/**
 * Keeps the canvas list polled and reconciled for the whole app. Renders nothing.
 *
 * Mounted once at the app root so polling continues regardless of which route or pane is open.
 * react-query serves the single 'userCanvases' query to every observer at no extra fetch cost.
 *
 * useCanvasSyncReconcile must be mounted exactly here and nowhere else; see the note on that hook
 * for why a second copy would produce redundant graph fetches.
 */
const CanvasSync = () => {
  useCanvasSync();
  useCanvasSyncReconcile();
  return null;
};

export default CanvasSync;
