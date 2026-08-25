import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResultsNavigate } from '@/features/Navigation/hooks/useResultsNavigate';
import useEvidenceViewNavigation from '@/features/ResultList/hooks/useEvidenceViewNavigation';
import type { Canvas, CanvasNode, CanvasEdge } from '@/features/Canvas/types/canvas';
import type { EvidenceTabName } from '@/features/Evidence/types/navigation';
import { canvasEntityParams } from '@/features/Canvas/utils/canvasRouteUtils';

const useCanvasEntityNavigation = () => {
  const navigate = useNavigate();
  const resultsNavigate = useResultsNavigate();
  const { navigateToEvidenceView } = useEvidenceViewNavigation();

  const navigateToNode = useCallback((canvas: Canvas, node: CanvasNode) => {
    const params = canvasEntityParams(canvas, node.dataId);
    if (canvas.resultRef && canvas.queryRef) {
      resultsNavigate(
        `/results/${canvas.resultRef}/node/${encodeURIComponent(node.ref)}`,
        { q: canvas.queryRef, ...params },
      );
    } else {
      navigate({
        pathname: `/node/${encodeURIComponent(node.ref)}`,
        search: new URLSearchParams(params).toString(),
      });
    }
  }, [navigate, resultsNavigate]);

  const navigateToEdge = useCallback((
    canvas: Canvas,
    edge: CanvasEdge,
    tab?: EvidenceTabName,
  ) => {
    const params: Record<string, string> = canvasEntityParams(canvas, edge.dataId);
    if (canvas.queryRef) params.q = canvas.queryRef;
    if (tab) params.tab = tab;
    if (canvas.resultRef && canvas.queryRef) {
      navigateToEvidenceView({
        edgeId: edge.ref,
        resultId: canvas.resultRef,
        tab,
        extraParams: { q: canvas.queryRef, ...params },
      });
    } else {
      navigate({
        pathname: `/evidence/${encodeURIComponent(edge.ref)}`,
        search: new URLSearchParams(params).toString(),
      });
    }
  }, [navigate, navigateToEvidenceView]);

  return { navigateToNode, navigateToEdge };
};

export default useCanvasEntityNavigation;
