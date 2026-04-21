import { FC, useRef, useState, useEffect, MouseEvent } from "react";
import { ResultSet } from "@/features/ResultList/types/results";
import { GraphHoverTarget } from "@/features/ResultGraphView/types/graphTypes";
import { nodeToTooltipProps, edgeToTooltipEntry } from "@/features/Core/components/Tooltips/tooltipMappers";
import EdgeTooltipContent from "@/features/Core/components/Tooltips/EdgeTooltipContent";
import Tooltip from "@/features/Common/components/Tooltip/Tooltip";
import NodeTooltipContent from "@/features/Core/components/Tooltips/NodeTooltipContent";

interface GraphHoverTooltipsProps {
  cursor: { x: number; y: number } | null;
  resultSet?: ResultSet;
  target: GraphHoverTarget;
  onTooltipEnter?: () => void;
  onTooltipLeave?: () => void;
  onPredicateClick?: (e: MouseEvent<HTMLSpanElement>, edgeId: string) => void;
}

interface Slot {
  target: GraphHoverTarget;
  isOpen: boolean;
}

type SlotPair = [Slot, Slot];

const EMPTY_SLOTS: SlotPair = [
  { target: null, isOpen: false },
  { target: null, isOpen: false },
];

const TOOLTIP_IDS = {
  node: ['graph-node-tooltip-a', 'graph-node-tooltip-b'] as const,
  edge: ['graph-edge-tooltip-a', 'graph-edge-tooltip-b'] as const,
};

const useSlotPair = (target: GraphHoverTarget, kind: 'node' | 'edge'): SlotPair => {
  const [slots, setSlots] = useState<SlotPair>(EMPTY_SLOTS);
  const activeIndexRef = useRef<0 | 1>(0);

  useEffect(() => {
    const incoming = target?.kind === kind ? target : null;
    const activeIdx = activeIndexRef.current;

    setSlots(prev => {
      const active = prev[activeIdx];
      const other = prev[activeIdx === 0 ? 1 : 0];

      if (!incoming) {
        if (!active.isOpen && !other.isOpen) return prev;
        const closed: SlotPair = [
          { target: prev[0].target, isOpen: false },
          { target: prev[1].target, isOpen: false },
        ];
        return closed;
      }

      if (active.isOpen && active.target && active.target.id === incoming.id) {
        return prev;
      }

      const nextIdx: 0 | 1 = activeIdx === 0 ? 1 : 0;
      activeIndexRef.current = nextIdx;
      const next: SlotPair = [
        { target: prev[0].target, isOpen: false },
        { target: prev[1].target, isOpen: false },
      ];
      next[nextIdx] = { target: incoming, isOpen: true };
      return next;
    });
  }, [target, kind]);

  return slots;
};

const GraphHoverTooltips: FC<GraphHoverTooltipsProps> = ({
  cursor,
  resultSet,
  target,
  onPredicateClick,
  onTooltipEnter,
  onTooltipLeave,
}) => {
  const nodeSlots = useSlotPair(target, 'node');
  const edgeSlots = useSlotPair(target, 'edge');

  const renderNodeSlot = (slot: Slot, id: string) => {
    const props = slot.target?.kind === 'node' ? nodeToTooltipProps(slot.target.node) : null;
    const position = slot.target?.anchor ?? cursor ?? undefined;
    return (
      <Tooltip
        key={id}
        id={id}
        isOpen={slot.isOpen && Boolean(position)}
        position={position}
      >
        {props && (
          <div onMouseEnter={onTooltipEnter} onMouseLeave={onTooltipLeave}>
            <NodeTooltipContent {...props} />
          </div>
        )}
      </Tooltip>
    );
  };

  const renderEdgeSlot = (slot: Slot, id: string) => {
    const entries = slot.target?.kind === 'edge' && resultSet
      ? [edgeToTooltipEntry(resultSet, slot.target.edge)]
      : [];
    const position = slot.target?.anchor ?? cursor ?? undefined;
    return (
      <Tooltip
        key={id}
        id={id}
        isOpen={slot.isOpen && entries.length > 0 && Boolean(position)}
        position={position}
      >
        {entries.length > 0 && (
          <div onMouseEnter={onTooltipEnter} onMouseLeave={onTooltipLeave}>
            <EdgeTooltipContent
              edges={entries}
              onPredicateClick={onPredicateClick}
            />
          </div>
        )}
      </Tooltip>
    );
  };

  return (
    <>
      {nodeSlots.map((slot, i) => renderNodeSlot(slot, TOOLTIP_IDS.node[i]))}
      {edgeSlots.map((slot, i) => renderEdgeSlot(slot, TOOLTIP_IDS.edge[i]))}
    </>
  );
};

export default GraphHoverTooltips;
