import { FC, ReactNode, useMemo } from "react";
import styles from "./NodeInformationView.module.scss";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { getResultSetById } from "@/features/ResultList/slices/resultsSlice";
import { getQueryStatusById } from "@/features/ResultList/slices/queryStatusSlice";
import { getDataFromQueryVar, getFormattedNodeName } from "@/features/Common/utils/utilities";
import { useDecodedParams } from "@/features/Core/hooks/useDecodedParams";
import Tabs from "@/features/Common/components/Tabs/Tabs";
import Tab from "@/features/Common/components/Tabs/Tab";
import { formatBiolinkEntity, getNodeIcon } from "@/features/Common/utils/utilities";
import { formatLabel, renderValue } from "@/features/NodeInformationView/utils/utilities";
import useNodeTypeDefinition from "@/features/NodeInformationView/hooks/useNodeTypeDefinition";
import NodeViewSkeleton from "@/features/NodeInformationView/components/NodeViewSkeleton/NodeViewSkeleton";
import ViewNotFound from "@/features/Navigation/components/ViewNotFound/ViewNotFound";
import SafeHtmlHighlighter from "@/features/Core/components/SafeHtmlHighlighter/SafeHtmlHighlighter";

const NodeInformationView: FC = () => {
  const { nodeId } = useParams();
  const decodedParams = useDecodedParams();
  const queryId = getDataFromQueryVar("q", decodedParams);
  const resultSet = useSelector(getResultSetById(queryId));
  const queryStatus = useSelector(getQueryStatusById(queryId));

  const node = nodeId ? resultSet?.data?.nodes?.[nodeId] ?? null : null;
  const nodeType = useMemo(() => node?.types[0] ?? null, [node?.types]);
  const nodeName = useMemo(() => getFormattedNodeName(node?.names[0] ?? undefined, nodeType ?? null), [node?.names, nodeType]);
  
  const { data: nodeTypeDefinition } = useNodeTypeDefinition(nodeType);

  const annotationFields = useMemo<{label: string; content: ReactNode}[]>(() => {
    if(!node || !node.annotations) return [];
    const fields: {label: string; content: ReactNode}[] = [];
    for(const category of Object.values(node.annotations)) {
      for(const [key, value] of Object.entries(category)) {
        if(key === "descriptions" || value === null || value === undefined) continue;
        const content = renderValue(value);
        if(content !== null) fields.push({ label: formatLabel(key), content });
      }
    }
    return fields;
  }, [node]);

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

  if (!queryId) {
    return <ViewNotFound entity="query" id="missing" />;
  }

  // Loading: result set not loaded yet and query is still loading
  if (!resultSet && (!queryStatus || queryStatus.isLoading)) {
    return <NodeViewSkeleton />;
  }

  // Not found: result set loaded but node not in it
  if (!node) {
    return <ViewNotFound entity="node" id={nodeId || "unknown"} />;
  }

  return (
    <div className={styles.nodeInformationView}>
      <div className={styles.top}>
        <div className={styles.nodeName}>
          <span className={styles.nodeTypeIcon}>{getNodeIcon(nodeType || "")} {formatBiolinkEntity(nodeType || "")}</span>
          <h5 className={styles.nodeTitle}>{nodeName}</h5>
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
                    <a href="https://biolink.github.io/biolink-model/" target="_blank" rel="noreferrer">Learn More About the Biolink Model</a>
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
