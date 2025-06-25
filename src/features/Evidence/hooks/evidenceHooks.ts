import { HoverTarget } from "@/features/ResultList/types/results";
import { useCallback, useState } from "react";

/**
 * Custom hook to track the index of hovered compressed edges in the evidence modal 
 */
export const useHoverPathObject = (setHoveredItem: (target: HoverTarget) => void) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getHoverHandlers = useCallback(
    (isEdge: boolean, id: string, index?: number) => ({
      onMouseEnter: () => {
        const type = isEdge ? 'edge' : 'node';
        setHoveredItem({ id: id, type: type});
        if(typeof index === 'number')
          setHoveredIndex(index);
      },
      onMouseLeave: () => {
        setHoveredItem(null);
        setHoveredIndex(null)
      },
    }),
    [setHoveredItem]
  );

  return {
    hoveredIndex,
    getHoverHandlers,
    resetHoveredIndex: () => setHoveredIndex(null),
  };
};