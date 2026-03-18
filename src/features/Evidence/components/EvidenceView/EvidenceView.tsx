import { FC, useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getResultSetById, getResultById, getPathById } from '@/features/ResultList/slices/resultsSlice';
import { getQueryStatusById } from '@/features/ResultList/slices/queryStatusSlice';
import { getDataFromQueryVar, getCompressedSubgraph, getCompressedEdge, hasSupport, scrollToRef } from '@/features/Common/utils/utilities';
import { isResultEdge, ResultEdge, ResultNode } from '@/features/ResultList/types/results.d';
import { useDecodedParams } from '@/features/Core/hooks/useDecodedParams';
import { currentPrefs } from '@/features/UserAuth/slices/userSlice';
import { useSeenStatus } from '@/features/ResultItem/hooks/resultHooks';
import { useEvidenceData, useEdgeInitialization } from '@/features/Evidence/hooks/evidenceHooks';
import { useResultsNavigate } from '@/features/Navigation/hooks/useResultsNavigate';
import { derivePathKey, resolveEdgeFromPath } from '@/features/Navigation/utils/navigationUtils';
import PathViewSection from '@/features/Evidence/components/PathViewSection/PathViewSection';
import EvidenceTabs from '@/features/Evidence/components/EvidenceTabs/EvidenceTabs';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import EvidenceViewSkeleton from '@/features/Evidence/components/EvidenceViewSkeleton/EvidenceViewSkeleton';
import ViewNotFound from '@/features/Navigation/components/ViewNotFound/ViewNotFound';
import styles from './EvidenceView.module.scss';

const EvidenceView: FC = () => {
  const { resultId, edgeId, pathId } = useParams();
  const resultsNavigate = useResultsNavigate();
  const decodedParams = useDecodedParams();
  const queryId = getDataFromQueryVar("q", decodedParams);

  const prefs = useSelector(currentPrefs);
  const resultSet = useSelector(getResultSetById(queryId));
  const queryStatus = useSelector(getQueryStatusById(queryId));

  const selectedEdgeDomRef = useRef<HTMLElement | null>(null);

  const [selectedEdge, setSelectedEdge] = useState<ResultEdge | null>(null);
  const selectedEdgeRef = useRef(selectedEdge);
  selectedEdgeRef.current = selectedEdge;
  const [edgeLabel, setEdgeLabel] = useState<string | null>(null);
  const [isPathViewMinimized, setIsPathViewMinimized] = useState(false);

  const pk = queryId || "";

  const result = useMemo(() => resultId ? getResultById(resultSet, resultId) : undefined, [resultSet, resultId]);

  const path = useMemo(() => {
    if (!resultSet || !pathId) return null;
    return getPathById(resultSet, pathId);
  }, [resultSet, pathId]);

  const decodedEdgeId = useMemo(() => edgeId ? decodeURIComponent(edgeId) : undefined, [edgeId]);

  const resolvedEdge = useMemo(() => {
    if (!resultSet || !decodedEdgeId) return null;
    return resolveEdgeFromPath(resultSet, path, decodedEdgeId);
  }, [resultSet, path, decodedEdgeId]);

  const pathKey = useMemo(
    () => getDataFromQueryVar("pkey", decodedParams) ?? derivePathKey(resultSet, result, pathId) ?? "",
    [decodedParams, resultSet, result, pathId]
  );

  const { isEdgeSeen, markEdgeSeen, markEdgeUnseen } = useSeenStatus(pk);

  const {
    publications,
    sources,
    clinicalTrials,
    miscEvidence,
    handleSelectedEdge: handleEvidenceData,
    setPublications,
  } = useEvidenceData({ setEdgeLabel });

  const isInferred = hasSupport(selectedEdge);
  const edgeSeen = !!selectedEdge?.id && isEdgeSeen(selectedEdge.id);

  const compressedSubgraph: (ResultNode | ResultEdge | ResultEdge[])[] | false = useMemo(() => {
    return path?.compressedSubgraph && !!resultSet ? getCompressedSubgraph(resultSet, path.compressedSubgraph) : false;
  }, [path, resultSet]);

  useEdgeInitialization({
    edgeId,
    resolvedEdge,
    resultSet,
    setSelectedEdge,
    handleEvidenceData,
    markEdgeSeen,
  });

  const handleEdgeClick = useCallback((edgeIDs: string[]) => {
    if (!resultSet) return;

    const getEdgeFromSubgraph = (edgeID: string, subgraph: (ResultEdge | ResultNode | ResultEdge[])[]) => {
      for (let i = 1; i < subgraph.length; i += 2) {
        const edgeItem = subgraph[i];
        if (Array.isArray(edgeItem)) {
          const found = edgeItem.find(e => e.id === edgeID);
          if (found) return found;
        } else {
          if (edgeItem.id === edgeID) return subgraph[i];
        }
      }
      return false;
    };

    let edge;
    if (compressedSubgraph)
      edge = getEdgeFromSubgraph(edgeIDs[0], compressedSubgraph);
    else
      edge = getCompressedEdge(resultSet, edgeIDs);

    if (!isResultEdge(edge) || !selectedEdgeRef.current || !resultSet) return;

    setSelectedEdge(edge);
    handleEvidenceData(resultSet, edge);
    markEdgeSeen(edge.id);

    if (resultId) {
      const encodedEdgeId = encodeURIComponent(edge.id);
      const basePath = pathId
        ? `/results/${resultId}/path/${pathId}/evidence/${encodedEdgeId}`
        : `/results/${resultId}/evidence/${encodedEdgeId}`;
      const pkeyParam = getDataFromQueryVar("pkey", decodedParams);
      resultsNavigate(basePath, pkeyParam ? { pkey: pkeyParam } : undefined, { replace: true });
    }
  }, [resultSet, compressedSubgraph, handleEvidenceData, markEdgeSeen, resultsNavigate, resultId, pathId, decodedParams]);

  useEffect(() => {
    if (selectedEdge) scrollToRef(selectedEdgeDomRef);
  }, [selectedEdge]);

  const handleToggleSeen = useCallback(() => {
    if (!selectedEdge?.id) {
      console.warn("Edge seen status cannot be toggled, selectedEdge is null.");
      return;
    }
    if (edgeSeen) markEdgeUnseen(selectedEdge.id);
    else markEdgeSeen(selectedEdge.id);
  }, [selectedEdge?.id, edgeSeen, markEdgeSeen, markEdgeUnseen]);

  if (!queryId) {
    return <ViewNotFound entity="query" id="missing" />;
  }

  if (!resultSet && (!queryStatus || queryStatus.isLoading)) {
    return <EvidenceViewSkeleton />;
  }

  if (!result) {
    return <ViewNotFound entity="result" id={resultId || 'unknown'} />;
  }

  if (!selectedEdge) {
    if (!resolvedEdge) {
      return <ViewNotFound entity="edge" id={edgeId || 'unknown'} />;
    }
    return <EvidenceViewSkeleton />;
  }

  return (
    <div className={styles.evidenceView}>
      <h5 className={styles.title}>
        {edgeLabel}
      </h5>
      <div className={styles.labelContainer}>
        {edgeLabel && <p className={styles.subtitle}>{isInferred ? "Indirect" : pathKey.length > 1 ? "Supporting" : "Direct"} Path {pathKey} Evidence</p>}
        <span className={styles.sep}>·</span>
        <p className={styles.toggleSeen} onClick={handleToggleSeen}>
          Mark as {edgeSeen ? "Unseen" : "Seen"}
        </p>
      </div>
      <Tooltip id="knowledge-sources-tooltip">
        <span>The resources that provided the information supporting the selected relationship.</span>
      </Tooltip>
      {path && (
        <PathViewSection
          path={path}
          compressedSubgraph={compressedSubgraph}
          isPathViewMinimized={isPathViewMinimized}
          setIsPathViewMinimized={setIsPathViewMinimized}
          handleEdgeClick={handleEdgeClick}
          isOpen={true}
          pk={pk}
          selectedEdge={selectedEdge}
          selectedEdgeRef={selectedEdgeDomRef}
        />
      )}
      {isInferred ? (
        <div className={styles.inferredDisclaimer}>
          <p>Supporting evidence for this relationship, including intermediary connections, can be found in the next path(s).</p>
          <p>Reasoning agents that use logic and pattern recognition to find connections between objects identified this path as a possible connection between this result and your search term.</p>
          <Link to="/help#reasoner" target="_blank" rel="noreferrer">Learn More about Reasoning Agents</Link>
        </div>
      ) : (
        <EvidenceTabs
          isOpen={true}
          publications={publications}
          setPublications={setPublications}
          clinicalTrials={clinicalTrials}
          miscEvidence={miscEvidence}
          sources={sources}
          selectedEdge={selectedEdge}
          pk={pk}
          prefs={prefs}
        />
      )}
    </div>
  );
};

export default EvidenceView;
