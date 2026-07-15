import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useCanvasPane from '@/features/Canvas/hooks/useCanvasPane';
import useCanvasInspector from '@/features/Canvas/hooks/useCanvasInspector';
import { canvasEntityRemovedToast } from '@/features/Core/utils/toastMessages';

const useCanvasHoverActions = (opts: {
  activeCanvas: ReturnType<typeof useCanvasPane>['activeCanvas'];
  clearHover: () => void;
  removeNode: (nodeId: string) => void;
  inspector: ReturnType<typeof useCanvasInspector>;
  navigate: ReturnType<typeof useNavigate>;
  setSelectedNodeIds: (ids: string[]) => void;
}) => {
  const { activeCanvas, clearHover, removeNode, inspector, navigate, setSelectedNodeIds } = opts;

  const handleHoverRemove = useCallback((nodeId: string) => {
    const nodeName = activeCanvas?.nodes[nodeId]?.names[0] || nodeId;
    removeNode(nodeId);
    clearHover();
    canvasEntityRemovedToast(nodeName);
  }, [activeCanvas, removeNode, clearHover]);

  const handleHoverNewQuery = useCallback((nodeId: string) => {
    clearHover();
    const canvasNode = activeCanvas?.nodes[nodeId];
    const term = canvasNode?.names[0] || canvasNode?.id;
    navigate(term ? `/new-query?prefill=${encodeURIComponent(term)}` : '/new-query');
  }, [activeCanvas, navigate, clearHover]);

  const handleHoverInformation = useCallback((nodeId: string) => {
    clearHover();
    const canvasNode = activeCanvas?.nodes[nodeId];
    setSelectedNodeIds([nodeId]);
    inspector.openView('node', canvasNode?.names[0] || nodeId, nodeId, {
      nodeId,
      queryPk: activeCanvas?.queryRef ?? undefined,
    });
  }, [clearHover, activeCanvas, setSelectedNodeIds, inspector]);

  return { handleHoverRemove, handleHoverNewQuery, handleHoverInformation };
};

export default useCanvasHoverActions;
