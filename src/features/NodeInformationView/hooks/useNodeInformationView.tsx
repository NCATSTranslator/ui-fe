import { ReactNode, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { getQueryStatusById } from "@/features/ResultList/slices/queryStatusSlice";
import { getFormattedNodeDisplayName } from "@/features/Core/utils/stringFormatters";
import { formatLabel, getNodeBiolinkLink, renderValue } from "@/features/NodeInformationView/utils/utilities";
import useNodeTypeDefinition from "@/features/NodeInformationView/hooks/useNodeTypeDefinition";
import ClinicalTrialsAnnotation from "@/features/NodeInformationView/components/ClinicalTrialsAnnotation/ClinicalTrialsAnnotation";
import { useCanvasNodeEntity } from "@/features/Canvas/hooks/useCanvasEntityRoute";
import useCanvasEntityViewState from "@/features/Canvas/hooks/useCanvasEntityViewState";
import type { ResultNode } from "@/features/ResultList/types/results.d";

interface AnnotationOverrideProps {
  value: unknown;
  nodeName: string;
  nodeType: string;
}

const ANNOTATION_OVERRIDES: Record<string, (props: AnnotationOverrideProps) => ReactNode> = {
  clinical_trials: ({ value, nodeName, nodeType }) => (
    <ClinicalTrialsAnnotation nctIds={value as string[]} nodeName={nodeName} nodeType={nodeType ?? ""} />
  ),
};

type NodeInformationViewState =
  | { kind: 'skeleton' }
  | { kind: 'not-found'; entity: string; id: string }
  | { kind: 'ready' };

const getNodeInformationViewState = (params: {
  showCanvasSkeleton: boolean;
  showCanvasNotFound: boolean;
  isCanvasOnlyMode: boolean;
  node: ResultNode | null;
  queryId?: string | null;
  resultSet: unknown;
  queryStatus: { isLoading?: boolean } | null | undefined;
  nodeId?: string;
}): NodeInformationViewState => {
  const missingNodeId = params.nodeId || "unknown";
  if (params.showCanvasSkeleton) return { kind: 'skeleton' };
  if (params.showCanvasNotFound) return { kind: 'not-found', entity: 'node', id: missingNodeId };
  if (params.isCanvasOnlyMode && !params.node) {
    return { kind: 'not-found', entity: 'node', id: missingNodeId };
  }
  if (!params.isCanvasOnlyMode) {
    if (!params.queryId) return { kind: 'not-found', entity: 'query', id: 'missing' };
    if (!params.resultSet && (!params.queryStatus || params.queryStatus.isLoading)) {
      return { kind: 'skeleton' };
    }
    if (!params.node) return { kind: 'not-found', entity: 'node', id: missingNodeId };
  }
  return { kind: 'ready' };
};

const buildAnnotationFields = (
  node: ResultNode | null,
  nodeName: string,
  nodeType: string | null,
): { label: string; content: ReactNode }[] => {
  if (!node?.annotations) return [];
  const fields: { label: string; content: ReactNode }[] = [];
  for (const category of Object.values(node.annotations)) {
    for (const [key, value] of Object.entries(category)) {
      if (key === "descriptions" || value === null || value === undefined) continue;
      const Override = ANNOTATION_OVERRIDES[key];
      if (Override) {
        fields.push({
          label: formatLabel(key),
          content: <Override value={value} nodeName={nodeName} nodeType={nodeType ?? ""} />,
        });
        continue;
      }
      const content = renderValue(value);
      if (content !== null) fields.push({ label: formatLabel(key), content });
    }
  }
  return fields;
};

const getNodeDescription = (node: ResultNode | null) => {
  if (!node?.annotations) return null;
  for (const key in node.annotations) {
    const annotation = node.annotations[key as keyof typeof node.annotations];
    if (annotation.descriptions !== null && annotation.descriptions.length > 0) {
      return annotation.descriptions[0];
    }
  }
  if (node.descriptions.length > 0) return node.descriptions[0];
  return null;
};

const useNodeInformationView = () => {
  const { nodeId } = useParams();
  const { isCanvasOnlyMode, queryId, resultSet, query, resultNode: canvasNode } = useCanvasNodeEntity();
  const queryStatus = useSelector(getQueryStatusById(queryId));
  const resultNode = nodeId ? resultSet?.data?.nodes?.[nodeId] ?? null : null;
  const node: ResultNode | null = isCanvasOnlyMode ? canvasNode : resultNode;
  const nodeType = useMemo(() => node?.types[0] ?? null, [node?.types]);
  const nodeName = useMemo(
    () => getFormattedNodeDisplayName(node),
    [node],
  );
  const { data: nodeTypeDefinition } = useNodeTypeDefinition(nodeType);
  const { showCanvasSkeleton, showCanvasNotFound } = useCanvasEntityViewState({
    isCanvasOnlyMode,
    isLoading: query.isLoading,
    isError: query.isError,
    hasEntity: !!node,
  });

  return {
    viewState: getNodeInformationViewState({
      showCanvasSkeleton,
      showCanvasNotFound,
      isCanvasOnlyMode,
      node,
      queryId,
      resultSet,
      queryStatus,
      nodeId,
    }),
    nodeType,
    nodeName,
    nodeBiolinkLink: node ? getNodeBiolinkLink(node) : "https://biolink.github.io/biolink-model/",
    nodeTypeDefinition,
    annotationFields: buildAnnotationFields(node, nodeName ?? "", nodeType),
    description: getNodeDescription(node),
  };
};

export default useNodeInformationView;
