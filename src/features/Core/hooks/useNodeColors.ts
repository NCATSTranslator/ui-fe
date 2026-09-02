import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { GraphNodeColorRenderer } from 'translator-graph-view';
import { currentColorModeEnabled } from '@/features/Core/slices/colorModeSlice';
import { getNodeColors, type NodeColors } from '@/features/Core/utils/nodeColors';

/** True when nodes should be colored by their biolink type. */
export const useColorModeEnabled = (): boolean => useSelector(currentColorModeEnabled);

/**
 * Color renderer for translator-graph-view, or undefined while color mode is
 * off so the library keeps its own default node background.
 */
export const useGraphNodeColor = (): GraphNodeColorRenderer | undefined => {
  const enabled = useColorModeEnabled();
  const getColor = useCallback<GraphNodeColorRenderer>((type) => getNodeColors(type), []);
  return enabled ? getColor : undefined;
};

/**
 * Colors for a node rendered by this app rather than the graph library, or
 * null while color mode is off so the stylesheet default applies.
 */
export const useNodeColors = (type: string | undefined | null): NodeColors | null => {
  const enabled = useColorModeEnabled();
  return enabled ? getNodeColors(type) : null;
};
