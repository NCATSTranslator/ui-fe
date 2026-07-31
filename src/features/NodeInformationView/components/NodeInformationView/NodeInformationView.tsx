import { FC, ReactNode, useMemo } from "react";
import styles from "./NodeInformationView.module.scss";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { getQueryStatusById } from "@/features/ResultList/slices/queryStatusSlice";
import { getFormattedNodeName, formatBiolinkEntity } from "@/features/Core/utils/stringFormatters";
import { getNodeIcon } from "@/features/Core/utils/entityLinks";
import Tabs from "@/features/Core/components/Tabs/Tabs";
import Tab from "@/features/Core/components/Tabs/Tab";
import { formatLabel, getNodeBiolinkLink, renderValue } from "@/features/NodeInformationView/utils/utilities";
import useNodeTypeDefinition from "@/features/NodeInformationView/hooks/useNodeTypeDefinition";
import NodeViewSkeleton from "@/features/NodeInformationView/components/NodeViewSkeleton/NodeViewSkeleton";
import ViewNotFound from "@/features/Navigation/components/ViewNotFound/ViewNotFound";
import SafeHtmlHighlighter from "@/features/Core/components/SafeHtmlHighlighter/SafeHtmlHighlighter";
import ClinicalTrialsAnnotation from "@/features/NodeInformationView/components/ClinicalTrialsAnnotation/ClinicalTrialsAnnotation";
import ViewTopBar from "@/features/Navigation/components/ViewTopBar/ViewTopBar";
import { useCanvasNodeEntity } from "@/features/Canvas/hooks/useCanvasEntityRoute";
import useCanvasEntityViewState from "@/features/Canvas/hooks/useCanvasEntityViewState";
import type { ResultNode } from "@/features/ResultList/types/results.d";

interface AnnotationOverrideProps {
  value: unknown;
  nodeName: string;
  nodeType: string;
}

const ANNOTATION_OVERRIDES: Record<string, FC<AnnotationOverrideProps>> = {
  clinical_trials: ({ value, nodeName, nodeType }) => (
    <ClinicalTrialsAnnotation nctIds={value as string[]} nodeName={nodeName} nodeType={nodeType ?? ""} />
  ),
};

const NodeInformationView: FC = () => {
  const { nodeId } = useParams();
  const { isCanvasOnlyMode, queryId, resultSet, query, resultNode: canvasNode } = useCanvasNodeEntity();
  const queryStatus = useSelector(getQueryStatusById(queryId));

  const resultNode = nodeId ? resultSet?.data?.nodes?.[nodeId] ?? null : null;
  const node: ResultNode | null = isCanvasOnlyMode ? canvasNode : resultNode;

  const nodeType = useMemo(() => node?.types[0] ?? null, [node?.types]);
  const nodeName = useMemo(
    () => getFormattedNodeName(node?.names[0] ?? undefined, nodeType ?? null),
    [node?.names, nodeType],
  );
  const nodeBiolinkLink = node ? getNodeBiolinkLink(node) : "https://biolink.github.io/biolink-model/";

  const { data: nodeTypeDefinition } = useNodeTypeDefinition(nodeType);

  const annotationFields = useMemo<{label: string; content: ReactNode}[]>(() => {
    if(!node || !node.annotations) return [];
    const fields: {label: string; content: ReactNode}[] = [];
    for(const category of Object.values(node.annotations)) {
      for(const [key, value] of Object.entries(category)) {
        if(key === "descriptions" || value === null || value === undefined) continue;
        const Override = ANNOTATION_OVERRIDES[key];
        if(Override) {
          fields.push({ label: formatLabel(key), content: <Override value={value} nodeName={nodeName ?? ""} nodeType={nodeType ?? ""} /> });
          continue;
        }
        const content = renderValue(value);
        if(content !== null) fields.push({ label: formatLabel(key), content });
      }
    }
    return fields;
  }, [node, nodeName, nodeType]);

  const description = useMemo(() => {
    if(!node || !node.annotations) return null;
    for(const key in node.annotations) {
      const annotation = node.annotations[key as keyof typeof node.annotations];
      if(annotation.descriptions !== null && annotation.descriptions.length > 0)
        return annotation.descriptions[0];
    }
    if(node.descriptions.length > 0)
      return node.descriptions[0];

    return null;
  }, [node]);

  const { showCanvasSkeleton, showCanvasNotFound } = useCanvasEntityViewState({
    isCanvasOnlyMode,
    isLoading: query.isLoading,
    isError: query.isError,
    hasEntity: !!node,
  });

  if (showCanvasSkeleton) return <NodeViewSkeleton />;
  if (showCanvasNotFound) {
    return <ViewNotFound entity="node" id={nodeId || "unknown"} />;
  }

  if (isCanvasOnlyMode && !node) {
    return <ViewNotFound entity="node" id={nodeId || "unknown"} />;
  }

  if (!isCanvasOnlyMode) {
    if (!queryId) {
      return <ViewNotFound entity="query" id="missing" />;
    }

    if (!resultSet && (!queryStatus || queryStatus.isLoading)) {
      return <NodeViewSkeleton />;
    }

    if (!node) {
      return <ViewNotFound entity="node" id={nodeId || "unknown"} />;
    }
  }

  return (
    <div className={styles.nodeInformationView}>
      <ViewTopBar/>
      <div className={styles.top}>
        <div className={styles.nodeName}>
          {getNodeIcon(nodeType || "")}
          <h1 className={styles.nodeTitle}>{nodeName}</h1>
        </div>
      </div>
      <Tabs
        className={styles.tabs}
        fadeClassName={styles.tabFade}
        tabListClassName={styles.tabList}
        tabListWrapperClassName={styles.tabListWrapper}
      >
        {
          [
            <Tab heading="Information" className={styles.tabContent} key="information">
              <div className={styles.information}>
                {
                  description &&
                  <div className={styles.section}>
                    <p className={styles.sectionTitle}>Description</p>
                    <p className={styles.description}>
                      <SafeHtmlHighlighter
                        htmlString={description || ""}
                        searchWords={[]}
                        highlightClassName="highlight"
                      />
                    </p>
                  </div>
                }
                {
                  nodeType &&
                  <div className={styles.section}>
                    <p className={styles.sectionTitle}>{formatBiolinkEntity(nodeType)} <span className={styles.subtitle}>— Object Type</span></p>
                    <p className={styles.description}>{nodeTypeDefinition}</p>
                    <a href={nodeBiolinkLink} target="_blank" rel="noreferrer">Learn More About the Biolink Model</a>
                  </div>
                }
                {
                  annotationFields.map(({ label, content }) => (
                    <div key={label} className={styles.section}>
                      <p className={styles.sectionTitle}>{label}</p>
                      <p className={styles.sectionContent}>{content}</p>
                    </div>
                  ))
                }
              </div>
            </Tab>
          ]
        }
      </Tabs>
    </div>
  );
};

export default NodeInformationView;
