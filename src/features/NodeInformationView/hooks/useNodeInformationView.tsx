import { FC, ReactNode, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { getQueryStatusById } from "@/features/ResultList/slices/queryStatusSlice";
import { capitalizeAllWords, getFormattedNodeDisplayName } from "@/features/Core/utils/stringFormatters";
import { formatLabel, getNodeBiolinkLink, renderValue } from "@/features/NodeInformationView/utils/utilities";
import useNodeTypeDefinition from "@/features/NodeInformationView/hooks/useNodeTypeDefinition";
import ClinicalTrialsAnnotation from "@/features/NodeInformationView/components/ClinicalTrialsAnnotation/ClinicalTrialsAnnotation";
import { useCanvasNodeEntity } from "@/features/Canvas/hooks/useCanvasEntityRoute";
import useCanvasEntityViewState from "@/features/Canvas/hooks/useCanvasEntityViewState";
import type { ChebiRole, Indication, ResultNode } from "@/features/ResultList/types/results.d";

interface AnnotationOverrideProps {
  value: unknown;
  nodeName: string;
  nodeType: string;
}

const ClinicalTrials: FC<AnnotationOverrideProps> = ({ value, nodeName, nodeType }) => (
  <ClinicalTrialsAnnotation nctIds={value as string[]} nodeName={nodeName} nodeType={nodeType ?? ""} />
);

const GeneName: FC<AnnotationOverrideProps> = ({ value }) => (
  <>{typeof value === "string" ? capitalizeAllWords(value) : renderValue(value)}</>
);

const SynonymList: FC<AnnotationOverrideProps> = ({ value }) => (
  <>{(value as string[]).map(synonym => capitalizeAllWords(synonym)).join(", ")}</>
);

const ChemicalSynonymList: FC<AnnotationOverrideProps> = ({ value }) => {
  const { commercial = [], generic = [] } = (value ?? {}) as { commercial?: string[]; generic?: string[] };
  const names = [...commercial, ...generic];
  if (names.length === 0) return null;
  return <>{names.map(name => capitalizeAllWords(name)).join(", ")}</>;
};

const ChemicalRoleList: FC<AnnotationOverrideProps> = ({ value }) => {
  const roles = (value ?? []) as ChebiRole[];
  if (roles.length === 0) return null;
  return <>{roles.map(role => capitalizeAllWords(role.name)).join(", ")}</>;
};

const Indications: FC<AnnotationOverrideProps> = ({ value }) => (
  <>
    {(value as Indication[])
      .map((indication, i) => {
        const url = indication.urls[0];
        const name = capitalizeAllWords(indication.name);
        return url
          ? <a key={i} href={url} target="_blank" rel="noreferrer">{name}</a>
          : <span key={i}>{name}</span>;
      })
      .flatMap((el, i) => (i === 0 ? [el] : [", ", el]))}
  </>
);

const ANNOTATION_OVERRIDES: Record<string, Record<string, FC<AnnotationOverrideProps>>> = {
  chemical: {
    clinical_trials: ClinicalTrials,
    indications: Indications,
    roles: ChemicalRoleList,
    synonyms: ChemicalSynonymList,
  },
  disease: {
    clinical_trials: ClinicalTrials,
    synonyms: SynonymList,
  },
  gene: {
    name: GeneName,
  },
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
  for (const [categoryKey, category] of Object.entries(node.annotations)) {
    for (const [key, section] of Object.entries(category)) {
      if (key === "descriptions" || section === null || section === undefined) continue;
      const value = section.value;
      const Override = ANNOTATION_OVERRIDES[categoryKey]?.[key];
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
    const descriptions = annotation.descriptions?.value;
    if (descriptions && descriptions.length > 0) return descriptions[0];
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
