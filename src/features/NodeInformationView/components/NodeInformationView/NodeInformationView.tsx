import { FC } from "react";
import styles from "./NodeInformationView.module.scss";
import { getNodeIcon } from "@/features/Core/utils/entityLinks";
import { formatBiolinkEntity } from "@/features/Core/utils/stringFormatters";
import Tabs from "@/features/Core/components/Tabs/Tabs";
import Tab from "@/features/Core/components/Tabs/Tab";
import NodeViewSkeleton from "@/features/NodeInformationView/components/NodeViewSkeleton/NodeViewSkeleton";
import ViewNotFound from "@/features/Navigation/components/ViewNotFound/ViewNotFound";
import SafeHtmlHighlighter from "@/features/Core/components/SafeHtmlHighlighter/SafeHtmlHighlighter";
import ViewTopBar from "@/features/Navigation/components/ViewTopBar/ViewTopBar";
import useNodeInformationView from "@/features/NodeInformationView/hooks/useNodeInformationView";

const NodeInformationView: FC = () => {
  const {
    viewState,
    nodeType,
    nodeName,
    nodeBiolinkLink,
    nodeTypeDefinition,
    annotationFields,
    description,
  } = useNodeInformationView();

  if (viewState.kind === 'skeleton') return <NodeViewSkeleton />;
  if (viewState.kind === 'not-found') {
    return <ViewNotFound entity={viewState.entity} id={viewState.id} />;
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
