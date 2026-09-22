import { FC, useMemo } from "react";
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
import { AnnotationSource } from "@/features/ResultList/types/results";
import { getAnnotationSourceLabel, getBiolinkSource, OBJECT_TYPE_SECTION_KEY } from "@/features/NodeInformationView/utils/utilities";
import AnnotationLink from "@/features/NodeInformationView/components/AnnotationLink/AnnotationLink";

/**
 * Renders the linkouts for an annotation section's sources. Duplicate and
 * url-less sources are dropped, and nothing is rendered when none remain.
 */
interface SourceLinksProps {
  sources: AnnotationSource[] | undefined;
  // Section key used to look up a sourceLabel override; omitted for sections without one.
  sectionKey?: string;
}

const SourceLinks: FC<SourceLinksProps> = ({ sources, sectionKey }) => {
  const links = useMemo(() => {
    const seen = new Set<string>();
    return (sources ?? []).filter(source => {
      if(!source?.url || seen.has(source.url)) return false;
      seen.add(source.url);
      return true;
    });
  }, [sources]);

  if(links.length === 0) return null;

  return (
    <div className={styles.sourceLinks}>
      {
        links.map(source => (
          <AnnotationLink key={source.url} href={source.url}>{getAnnotationSourceLabel(source, sectionKey)}</AnnotationLink>
        ))
      }
    </div>
  );
};

const NodeInformationView: FC = () => {
  const {
    viewState,
    nodeType,
    nodeName,
    geneFullName,
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
        {geneFullName && <p className={styles.nodeFullName}>{geneFullName}</p>}
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
                        htmlString={description.text}
                        searchWords={[]}
                        highlightClassName="highlight"
                      />
                    </p>
                    <SourceLinks sources={description.sources} />
                  </div>
                }
                {
                  nodeType &&
                  <div className={styles.section}>
                    <p className={styles.sectionTitle}>{formatBiolinkEntity(nodeType)} <span className={styles.subtitle}>— Object Type</span></p>
                    <p className={styles.description}>{nodeTypeDefinition}</p>
                    <SourceLinks sources={[getBiolinkSource(nodeBiolinkLink)]} sectionKey={OBJECT_TYPE_SECTION_KEY} />
                  </div>
                }
                {
                  annotationFields.map(({ key, heading, content, sources }) => (
                    <div key={key} className={styles.section}>
                      <p className={styles.sectionTitle}>{heading}</p>
                      <div className={styles.sectionContent}>{content}</div>
                      <SourceLinks sources={sources} sectionKey={key} />
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
