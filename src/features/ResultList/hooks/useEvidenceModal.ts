import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { Result, ResultEdge, ResultSet, Path } from '@/features/ResultList/types/results.d';
import { getEdgeById } from '@/features/ResultList/slices/resultsSlice';
import { getCompressedEdge } from '@/features/Common/utils/utilities';

export interface UseEvidenceModalReturn {
  evidenceModalOpen: boolean;
  setEvidenceModalOpen: Dispatch<SetStateAction<boolean>>;
  selectedResult: Result | null;
  selectedEdge: ResultEdge | null;
  selectedPath: Path | null;
  selectedPathKey: string;
  activateEvidence: (item: Result, edgeID: string | string[], path: Path, pathKey: string) => void;
  resetEvidenceModal: () => void;
}

const useEvidenceModal = (resultSet: ResultSet | null | undefined): UseEvidenceModalReturn => {
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ResultEdge | null>(null);
  const [selectedPath, setSelectedPath] = useState<Path | null>(null);
  const [selectedPathKey, setSelectedPathKey] = useState<string>("");

  const activateEvidence = useCallback((item: Result, edgeID: string | string[], path: Path, pathKey: string) => {
    if (!resultSet)
      return;
    let edge;
    if (!Array.isArray(edgeID))
      edge = getEdgeById(resultSet, edgeID);
    else
      edge = getCompressedEdge(resultSet, edgeID);

    if (!!edge) {
      setSelectedResult(item);
      setSelectedEdge(edge);
      setSelectedPath(path);
      setSelectedPathKey(pathKey);
      setEvidenceModalOpen(true);
    }
  }, [resultSet]);

  const resetEvidenceModal = useCallback(() => {
    setSelectedResult(null);
    setSelectedEdge(null);
    setSelectedPath(null);
    setSelectedPathKey("");
    setEvidenceModalOpen(false);
  }, []);

  return {
    evidenceModalOpen,
    setEvidenceModalOpen,
    selectedResult,
    selectedEdge,
    selectedPath,
    selectedPathKey,
    activateEvidence,
    resetEvidenceModal,
  };
};

export default useEvidenceModal;
