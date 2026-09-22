import { FC, ReactNode, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { getQueryStatusById } from "@/features/ResultList/slices/queryStatusSlice";
import { capitalizeAllWords, getFormattedNodeDisplayName } from "@/features/Core/utils/stringFormatters";
import { formatLabel, getNodeBiolinkLink, isEmptyAnnotationValue, renderList, renderValue, sortAnnotationFields } from "@/features/NodeInformationView/utils/utilities";
import useNodeTypeDefinition from "@/features/NodeInformationView/hooks/useNodeTypeDefinition";
import ClinicalTrialsAnnotation from "@/features/NodeInformationView/components/ClinicalTrialsAnnotation/ClinicalTrialsAnnotation";
import AnnotationLink from "@/features/NodeInformationView/components/AnnotationLink/AnnotationLink";
import { useCanvasNodeEntity } from "@/features/Canvas/hooks/useCanvasEntityRoute";
import useCanvasEntityViewState from "@/features/Canvas/hooks/useCanvasEntityViewState";
import type { AnnotationSource, ChebiRole, Indication, ResultNode } from "@/features/ResultList/types/results.d";
import { trackEvent } from '@/features/Analytics/utils/dataLayer';

interface AnnotationOverrideProps {
  value: unknown;
  nodeName: string;
  nodeType: string;
}

const ClinicalTrials: FC<AnnotationOverrideProps> = ({ value, nodeName, nodeType }) => (
  <ClinicalTrialsAnnotation nctIds={value as string[]} nodeName={nodeName} nodeType={nodeType ?? ""} />
);

// Annotation payloads come from external sources that can omit fields the types
// promise, so entries without a usable name are dropped rather than rendered.
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

const capitalizedList = (names: unknown[]): ReactNode =>
  renderList(names.filter(isNonEmptyString).map(name => capitalizeAllWords(name)));

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
    {renderList(
      (value as Indication[])
        .filter(indication => isNonEmptyString(indication?.name))
        .map((indication, i) => {
          const url = indication.urls?.[0];
          const name = capitalizeAllWords(indication.name);
          return url
            ? <AnnotationLink key={i} href={url}>{name}</AnnotationLink>
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
};

// Annotations rendered outside the section list: descriptions at the top of the tab,
// the gene's full name directly under the node title.
const EXCLUDED_ANNOTATIONS = new Set(["descriptions", "gene.name"]);

const isExcludedAnnotation = (categoryKey: string, key: string): boolean =>
  EXCLUDED_ANNOTATIONS.has(key) || EXCLUDED_ANNOTATIONS.has(`${categoryKey}.${key}`);

/**
 * The gene's full name, which is displayed under the node title rather than as a section.
 */
const getGeneFullName = (node: ResultNode | null): string | null => {
  const fullName = node?.annotations?.gene?.name?.value;
  if (!isNonEmptyString(fullName)) return null;
  return capitalizeAllWords(fullName);
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
  key: string;
  label: string;
  content: ReactNode;
  sources: AnnotationSource[];
}

const buildAnnotationField = (
  categoryKey: string,
  key: string,
  section: { value: unknown; metadata?: { sources?: AnnotationSource[] } },
  nodeName: string,
  nodeType: string | null,
): AnnotationField | null => {
  const fieldKey = `${categoryKey}.${key}`;
  const label = formatLabel(key);
  const { value } = section;
  const sources = section.metadata?.sources ?? [];
  const Override = ANNOTATION_OVERRIDES[categoryKey]?.[key];
  if (Override) {
    return { key: fieldKey, label, content: <Override value={value} nodeName={nodeName} nodeType={nodeType ?? ""} />, sources };
  }
  const content = renderValue(value);
  return content === null ? null : { key: fieldKey, label, content, sources };
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
      if (isExcludedAnnotation(categoryKey, key) || section === null || section === undefined) continue;
      if (isEmptyAnnotationValue(section.value)) continue;
      const field = buildAnnotationField(categoryKey, key, section, nodeName, nodeType);
      if (field) fields.push(field);
    }
  }
  return sortAnnotationFields(fields);
};

interface NodeDescription {
  text: string;
  sources: AnnotationSource[];
}

const getNodeDescription = (node: ResultNode | null): NodeDescription | null => {
  if (!node?.annotations) return null;
  for (const key in node.annotations) {
    const annotation = node.annotations[key as keyof typeof node.annotations];
    const section = annotation.descriptions;
    const descriptions = section?.value;
    if (descriptions && descriptions.length > 0)
      return { text: descriptions[0], sources: section?.metadata?.sources ?? [] };
  }
  if (node.descriptions.length > 0) return { text: node.descriptions[0], sources: [] };
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

  // Fire once per node, after the node resolves. The hook re-runs on every
  // annotation fetch and canvas state change, so a plain effect on mount would
  // both miss the CURIE and double count.
  const trackedNodeId = useRef<string | null>(null);
  useEffect(() => {
    if (!node || !nodeId || trackedNodeId.current === nodeId) return;
    trackedNodeId.current = nodeId;
    trackEvent('node_info_opened', {
      node_curie: node.curies?.[0],
      node_category: nodeType ?? undefined,
    });
  }, [node, nodeId, nodeType]);
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
    geneFullName: getGeneFullName(node),
    nodeBiolinkLink: node ? getNodeBiolinkLink(node) : "https://biolink.github.io/biolink-model/",
    nodeTypeDefinition,
    annotationFields: buildAnnotationFields(node, nodeName ?? "", nodeType),
    description: getNodeDescription(node),
  };
};

export default useNodeInformationView;
