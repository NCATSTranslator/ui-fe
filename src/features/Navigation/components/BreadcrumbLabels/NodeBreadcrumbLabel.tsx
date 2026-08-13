import { FC, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getFormattedNodeName } from '@/features/Core/utils/stringFormatters';
import { getNodeIcon } from '@/features/Core/utils/entityLinks';
import { fetchNodeNameFromCurie } from '@/features/Projects/utils/utilities';
import SkeletonBar from '@/features/Core/components/SkeletonBar/SkeletonBar';
import { useCanvasNodeEntity } from '@/features/Canvas/hooks/useCanvasEntityRoute';
import BreadcrumbLabelWithIcon from '@/features/Navigation/components/BreadcrumbLabelWithIcon/BreadcrumbLabelWithIcon';

const NodeBreadcrumbLabel: FC = () => {
  const { nodeId } = useParams();
  const { isCanvasOnlyMode, resultSet, formattedName, resultNode } = useCanvasNodeEntity();

  const node = nodeId ? resultSet?.data?.nodes?.[nodeId] : undefined;
  const nodeType = resultNode?.types[0] ?? node?.types[0] ?? '';

  const { data: resolvedName } = useQuery({
    queryKey: ['nodeName', nodeId],
    queryFn: ({ signal }) => {
      if (!nodeId) throw new Error('nodeId is required');
      return fetchNodeNameFromCurie(nodeId, signal);
    },
    enabled: !!nodeId && !node && !formattedName,
    staleTime: Infinity,
    placeholderData: nodeId ?? undefined,
  });

  const nodeName = useMemo(
    () => getFormattedNodeName(node?.names[0] ?? undefined, node?.types[0] ?? null),
    [node?.names, node?.types],
  );

  const renderLabel = (text: string) => (
    <BreadcrumbLabelWithIcon icon={getNodeIcon(nodeType)}>
      {text}
    </BreadcrumbLabelWithIcon>
  );

  if (isCanvasOnlyMode && formattedName) return renderLabel(formattedName);
  if (node) return renderLabel(nodeName);
  if (resolvedName) return renderLabel(resolvedName);
  if (nodeId) return renderLabel(nodeId);
  return <SkeletonBar width="100px" height="17px" />;
};

export default NodeBreadcrumbLabel;
