import { FC, ReactNode, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { getQueryStatusById } from "@/features/ResultList/slices/queryStatusSlice";
import { capitalizeAllWords, getFormattedNodeDisplayName } from "@/features/Core/utils/stringFormatters";
import { formatLabel, getNodeBiolinkLink, isEmptyAnnotationValue, joinNodes, renderValue } from "@/features/NodeInformationView/utils/utilities";
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

// Annotation payloads come from external sources that can omit fields the types
// promise, so entries without a usable name are dropped rather than rendered.
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

const capitalizedList = (names: unknown[]): string =>
  names.filter(isNonEmptyString).map(name => capitalizeAllWords(name)).join(", ");

const SynonymList: FC<AnnotationOverrideProps> = ({ value }) => (
  <>{capitalizedList(value as string[])}</>
);

const ChemicalSynonymList: FC<AnnotationOverrideProps> = ({ value }) => {
  const { commercial = [], generic = [] } = value as { commercial?: string[]; generic?: string[] };
  return <>{capitalizedList([...commercial, ...generic])}</>;
};

const ChemicalRoleList: FC<AnnotationOverrideProps> = ({ value }) => (
  <>{capitalizedList((value as ChebiRole[]).map(role => role?.name))}</>
);

const Indications: FC<AnnotationOverrideProps> = ({ value }) => (
  <>
    {joinNodes(
      (value as Indication[])
        .filter(indication => isNonEmptyString(indication?.name))
        .map((indication, i) => {
          const url = indication.urls?.[0];
          const name = capitalizeAllWords(indication.name);
          return url
            ? <a key={i} href={url} target="_blank" rel="noreferrer">{name}</a>
            : <span key={i}>{name}</span>;
        })
    )}
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

interface AnnotationField {
  label: string;
  content: ReactNode;
}

const buildAnnotationField = (
  categoryKey: string,
  key: string,
  value: unknown,
  nodeName: string,
  nodeType: string | null,
): AnnotationField | null => {
  const label = formatLabel(key);
  const Override = ANNOTATION_OVERRIDES[categoryKey]?.[key];
  if (Override) {
    return { label, content: <Override value={value} nodeName={nodeName} nodeType={nodeType ?? ""} /> };
  }
  const content = renderValue(value);
  return content === null ? null : { label, content };
};

const buildAnnotationFields = (
  node: ResultNode | null,
  nodeName: string,
  nodeType: string | null,
): AnnotationField[] => {
  if (!node?.annotations) return [];
  const fields: AnnotationField[] = [];
  for (const [categoryKey, category] of Object.entries(node.annotations)) {
    for (const [key, section] of Object.entries(category)) {
      if (key === "descriptions" || section === null || section === undefined) continue;
      if (isEmptyAnnotationValue(section.value)) continue;
      const field = buildAnnotationField(categoryKey, key, section.value, nodeName, nodeType);
      if (field) fields.push(field);
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
