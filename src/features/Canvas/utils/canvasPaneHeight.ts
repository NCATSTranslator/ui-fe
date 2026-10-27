/** Smallest height the canvas pane can be dragged to before the graph becomes unusable. */
export const CANVAS_PANE_MIN_HEIGHT = 200;
/** Share of the available area the pane takes before the user has dragged it. */
const DEFAULT_PANE_FRACTION = 0.5;

/**
 * Keeps a requested pane height inside [min, available]. An unmeasured area
 * (0) only enforces the minimum so the first paint is never clamped to nothing.
 */
export const clampPaneHeight = (height: number, availableHeight: number): number => {
  const atLeastMin = Math.max(height, CANVAS_PANE_MIN_HEIGHT);
  return availableHeight > 0 ? Math.min(atLeastMin, availableHeight) : atLeastMin;
};

export const defaultPaneHeight = (availableHeight: number): number =>
  Math.round(availableHeight * DEFAULT_PANE_FRACTION);

interface ResolvePaneHeightArgs {
  /** Height while a drag is in progress; takes priority over everything else. */
  dragHeight: number | null;
  paneMaximized: boolean;
  /** The last committed height, or null for the default split. */
  paneHeight: number | null;
  availableHeight: number;
}

/** The pixel height the pane should render at, or null when nothing has been measured yet. */
export const resolvePaneHeight = ({
  dragHeight,
  paneMaximized,
  paneHeight,
  availableHeight,
}: ResolvePaneHeightArgs): number | null => {
  if (dragHeight !== null) return dragHeight;
  if (availableHeight <= 0) return null;
  if (paneMaximized) return availableHeight;
  return clampPaneHeight(paneHeight ?? defaultPaneHeight(availableHeight), availableHeight);
};
