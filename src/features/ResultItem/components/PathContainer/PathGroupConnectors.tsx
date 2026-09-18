import { FC, memo, useMemo } from 'react';
import { generatePathD } from '@/features/ResultItem/utils/utilities';
import { ResultEdge } from '@/features/ResultList/types/results';
import { useHoveredEntityIdWithin } from '@/features/ResultItem/hooks/hoverHooks';

const EDGE_HEIGHT = 32;
const EDGE_GAP = 8;
const SVG_WIDTH = 198;
const CURVE_OFFSET = 50;
const STRAIGHT_SEGMENT_LENGTH = 20;
const PATH_THICKNESS = 32;

const PATH_COLOR = "#8C8C8C26";
const HOVERED_PATH_COLOR = "#6A5C8259";
const SELECTED_PATH_COLOR = "#5D4E778C";
const HOVERED_SELECTED_PATH_COLOR = "#3F2E5E59";

const getStrokeColor = (hovered: boolean, selected: boolean) => {
  if (hovered && selected)
    return HOVERED_SELECTED_PATH_COLOR;
  if (hovered)
    return HOVERED_PATH_COLOR;
  if (selected)
    return SELECTED_PATH_COLOR;

  return PATH_COLOR;
};

const getConnectorHeight = (edgeCount: number) => (edgeCount * (EDGE_HEIGHT + EDGE_GAP)) - EDGE_GAP;

interface PathGroupConnectorsProps {
  className?: string;
  /** The compressed edges this fan of connectors joins, in render order. */
  edges: ResultEdge[];
  /** True for the node → edge fan, false for the edge → node fan. */
  nodeToEdge: boolean;
  selectedEdgeId?: string | null;
}

/**
 * The connector curves drawn either side of a group of compressed edges.
 *
 * Split out from PathContainer so that subscribing to the hovered entity only
 * re-renders these curves rather than the whole path row.
 */
const PathGroupConnectors: FC<PathGroupConnectorsProps> = ({
  className,
  edges,
  nodeToEdge,
  selectedEdgeId = null,
}) => {
  const edgeIds = useMemo(() => edges.map(edge => edge.id), [edges]);
  const hoveredEdgeId = useHoveredEntityIdWithin(edgeIds);
  const height = getConnectorHeight(edges.length);

  return (
    <svg width={SVG_WIDTH} height={height} className={className}>
      {edges.map((edge, index) => (
        <path
          key={edge.id}
          d={generatePathD(index, height, SVG_WIDTH, EDGE_HEIGHT, nodeToEdge, CURVE_OFFSET, STRAIGHT_SEGMENT_LENGTH)}
          stroke={getStrokeColor(edge.id === hoveredEdgeId, edge.id === selectedEdgeId)}
          fill="transparent"
          strokeWidth={PATH_THICKNESS}
        />
      ))}
    </svg>
  );
};

export default memo(PathGroupConnectors);
