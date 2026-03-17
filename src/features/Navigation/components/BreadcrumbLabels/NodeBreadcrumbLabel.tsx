import { FC } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { getDataFromQueryVar } from '@/features/Common/utils/utilities';
import { fetchNodeNameFromCurie } from '@/features/Projects/utils/utilities';
import { useDecodedParams } from '@/features/Core/hooks/useDecodedParams';
import SkeletonBar from '@/features/Core/components/SkeletonBar/SkeletonBar';

const NodeBreadcrumbLabel: FC = () => {
  const { nodeId } = useParams();
  const decodedParams = useDecodedParams();
  const queryId = getDataFromQueryVar("q", decodedParams);
  const resultSet = useSelector(getResultSetById(queryId));

  const node = nodeId ? resultSet?.data?.nodes?.[nodeId] : undefined;

  const { data: resolvedName } = useQuery({
    queryKey: ['nodeName', nodeId],
    queryFn: ({ signal }) => fetchNodeNameFromCurie(nodeId!, signal),
    enabled: !!nodeId && !node,
    staleTime: Infinity,
    placeholderData: nodeId ?? undefined,
  });

  if (node) return <>{node.names[0]}</>;
  if (resolvedName) return <>{resolvedName}</>;
  if (nodeId) return <>{nodeId}</>;
  return <SkeletonBar width="100px" height="17px" />;
};

export default NodeBreadcrumbLabel;
