import { useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { InspectorAddToGraphHandlers } from '@/features/Canvas/components/CanvasInspector/CanvasInspector';
import { getResultById, getPathById, selectResultSets } from '@/features/ResultList/slices/resultsSlice';
import type { ResultSet, Result, Path } from '@/features/ResultList/types/results.d';

const SKIP_LARGE_WARNING_KEY = 'canvas-skip-large-add-warning';

interface CanvasResultActions {
  addResult: (resultSet: ResultSet, result: Result, sourceId: string) => void;
  addPath: (resultSet: ResultSet, path: Path, sourceId: string) => void;
  addQueryResults: (resultSet: ResultSet, sourceId: string) => void;
  addSingleNode: (resultSet: ResultSet, nodeId: string, sourceId: string) => void;
  addEdgeFromEvidence: (resultSet: ResultSet, edgeId: string, sourceId: string) => void;
  resultCountExceedsThreshold: (resultSet: ResultSet) => boolean;
}

const useCanvasInspectorHandlers = (actions: CanvasResultActions) => {
  const resultSets = useSelector(selectResultSets);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const pendingAddAllRef = useRef<string | null>(null);

  const { addResult, addPath, addQueryResults, addSingleNode, addEdgeFromEvidence, resultCountExceedsThreshold } = actions;

  const handleAddResult = useCallback((queryPk: string, resultId: string) => {
    const rs = resultSets[queryPk];
    if (!rs) return;
    const result = getResultById(rs, resultId);
    if (!result) return;
    addResult(rs, result, queryPk);
  }, [resultSets, addResult]);

  const handleAddPath = useCallback((queryPk: string, pathId: string) => {
    const rs = resultSets[queryPk];
    if (!rs) return;
    const path = getPathById(rs, pathId);
    if (!path) return;
    addPath(rs, path, queryPk);
  }, [resultSets, addPath]);

  const handleAddQueryResults = useCallback((queryPk: string) => {
    const rs = resultSets[queryPk];
    if (!rs) return;
    const skipWarning = localStorage.getItem(SKIP_LARGE_WARNING_KEY) === 'true';
    if (!skipWarning && resultCountExceedsThreshold(rs)) {
      pendingAddAllRef.current = queryPk;
      setWarningModalOpen(true);
      return;
    }
    addQueryResults(rs, queryPk);
  }, [resultSets, addQueryResults, resultCountExceedsThreshold]);

  const handleConfirmLargeAdd = useCallback(() => {
    const queryPk = pendingAddAllRef.current;
    if (!queryPk) return;
    const rs = resultSets[queryPk];
    if (rs) addQueryResults(rs, queryPk);
    pendingAddAllRef.current = null;
  }, [resultSets, addQueryResults]);

  const handleAddNode = useCallback((queryPk: string, nodeId: string) => {
    const rs = resultSets[queryPk];
    if (!rs) return;
    addSingleNode(rs, nodeId, queryPk);
  }, [resultSets, addSingleNode]);

  const handleAddEdge = useCallback((queryPk: string, edgeId: string) => {
    const rs = resultSets[queryPk];
    if (!rs) return;
    addEdgeFromEvidence(rs, edgeId, queryPk);
  }, [resultSets, addEdgeFromEvidence]);

  const addToGraphHandlers: InspectorAddToGraphHandlers = useMemo(() => ({
    onAddResult: handleAddResult,
    onAddPath: handleAddPath,
    onAddQueryResults: handleAddQueryResults,
    onAddNode: handleAddNode,
    onAddEdge: handleAddEdge,
  }), [handleAddResult, handleAddPath, handleAddQueryResults, handleAddNode, handleAddEdge]);

  const cancelWarning = useCallback(() => { pendingAddAllRef.current = null; }, []);
  const closeWarning = useCallback(() => setWarningModalOpen(false), []);

  return {
    addToGraphHandlers,
    warningModalOpen,
    handleConfirmLargeAdd,
    cancelWarning,
    closeWarning,
    skipWarningKey: SKIP_LARGE_WARNING_KEY,
  };
};

export default useCanvasInspectorHandlers;
