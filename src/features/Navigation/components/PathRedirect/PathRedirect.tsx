import { FC, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getResultSetById, getPathById } from '@/features/ResultList/slices/resultsSlice';
import { getQueryStatusById } from '@/features/ResultList/slices/queryStatusSlice';
import { getDataFromQueryVar } from '@/features/Common/utils/utilities';
import { useDecodedParams } from '@/features/Core/hooks/useDecodedParams';
import { useResultsNavigate } from '@/features/Navigation/hooks/useResultsNavigate';
import ViewSkeleton from '@/features/Navigation/components/ViewSkeleton/ViewSkeleton';
import ViewNotFound from '@/features/Navigation/components/ViewNotFound/ViewNotFound';

const PathRedirect: FC = () => {
  const { resultId, pathId } = useParams();
  const resultsNavigate = useResultsNavigate();
  const decodedParams = useDecodedParams();
  const queryId = getDataFromQueryVar("q", decodedParams);
  const resultSet = useSelector(getResultSetById(queryId));
  const queryStatus = useSelector(getQueryStatusById(queryId));

  const path = pathId ? getPathById(resultSet, pathId) : null;

  useEffect(() => {
    if (!path || !resultId || !pathId) return;

    const subgraph = path.compressedSubgraph ?? path.subgraph;
    const firstEdgeSlot = subgraph[1];
    const firstEdgeId = Array.isArray(firstEdgeSlot) ? firstEdgeSlot[0] : firstEdgeSlot;

    if (firstEdgeId) {
      resultsNavigate(
        `/results/${resultId}/path/${pathId}/evidence/${encodeURIComponent(firstEdgeId)}`,
        undefined,
        { replace: true },
      );
    }
  }, [path, resultId, pathId, resultsNavigate]);

  if (!resultSet && (!queryStatus || queryStatus.isLoading)) {
    return <ViewSkeleton statusMessage="Loading path..." />;
  }

  if (!path) {
    return <ViewNotFound entity="path" id={pathId || 'unknown'} />;
  }

  return <ViewSkeleton statusMessage="Loading evidence..." />;
};

export default PathRedirect;
