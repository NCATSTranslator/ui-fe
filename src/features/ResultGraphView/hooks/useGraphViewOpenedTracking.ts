import { useEffect, useRef } from 'react';
import type { GraphData } from 'translator-graph-view';
import { trackEvent } from '@/features/Analytics/utils/dataLayer';

/**
 * Reports graph_view_opened once each time the graph tab becomes visible with
 * data, not on every re-render or layout change.
 */
export const useGraphViewOpenedTracking = (graph: GraphData, active: boolean, hasData: boolean): void => {
  const tracked = useRef(false);

  useEffect(() => {
    if (!active || !hasData) {
      tracked.current = false;
      return;
    }
    if (tracked.current) return;
    tracked.current = true;
    trackEvent('graph_view_opened', {
      node_count: Object.keys(graph.nodes).length,
      edge_count: Object.keys(graph.edges).length,
    });
  }, [active, hasData, graph]);
};
