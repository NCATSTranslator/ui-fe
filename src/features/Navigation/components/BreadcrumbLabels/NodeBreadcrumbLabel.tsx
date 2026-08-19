import { FC, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getFormattedNodeDisplayName } from '@/features/Core/utils/stringFormatters';
import { getNodeIcon } from '@/features/Core/utils/entityLinks';
import { fetchNodeNameFromCurie } from '@/features/Projects/utils/utilities';
import SkeletonBar from '@/features/Core/components/SkeletonBar/SkeletonBar';
import { useCanvasNodeEntity } from '@/features/Canvas/hooks/useCanvasEntityRoute';
import BreadcrumbLabelWithIcon from '@/features/Navigation/components/BreadcrumbLabelWithIcon/BreadcrumbLabelWithIcon';
import type { ResultNode } from '@/features/ResultList/types/results.d';

const getNodeBreadcrumbText = ({
  isCanvasOnlyMode,
  formattedName,
  node,
  nodeName,
  resolvedName,
  nodeId,
}: {
  isCanvasOnlyMode: boolean;
  formattedName?: string | null;
  node?: ResultNode;
  nodeName?: string;
  resolvedName?: string;
  nodeId?: string;
}) => {
  if (isCanvasOnlyMode && formattedName) return formattedName;
  if (node && nodeName) return nodeName;
  if (resolvedName) return resolvedName;
  if (nodeId) return nodeId;
  return null;
};

const useNodeBreadcrumbLabel = () => {
  const { nodeId } = useParams();
  const { isCanvasOnlyMode, resultSet, formattedName, resultNode } = useCanvasNodeEntity();
  const node = nodeId ? resultSet?.data?.nodes?.[nodeId] : undefined;
  const nodeType = resultNode?.types[0] ?? node?.types[0] ?? '';
  const shouldFetchName = Boolean(nodeId) && !node && !formattedName;
  const { data: resolvedName } = useQuery({
    queryKey: ['nodeName', nodeId],
    queryFn: ({ signal }) => {
      if (!nodeId) return Promise.reject(new Error('nodeId is required'));
      return fetchNodeNameFromCurie(nodeId, signal);
    },
    enabled: shouldFetchName,
    staleTime: Infinity,
    placeholderData: nodeId || undefined,
  });
  const nodeName = useMemo(
    () => getFormattedNodeDisplayName(node),
    [node],
  );

  return {
    nodeType,
    label: getNodeBreadcrumbText({
      isCanvasOnlyMode, formattedName, node, nodeName, resolvedName, nodeId,
    }),
  };
};

const NodeBreadcrumbLabel: FC = () => {
  const { nodeType, label } = useNodeBreadcrumbLabel();
  if (!label) return <SkeletonBar width="100px" height="17px" />;
  return (
    <BreadcrumbLabelWithIcon icon={getNodeIcon(nodeType)}>
      {label}
    </BreadcrumbLabelWithIcon>
  );
};

export default NodeBreadcrumbLabel;
