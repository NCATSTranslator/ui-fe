import { FC, ReactNode, useMemo } from "react";
import styles from "./NodeInformationView.module.scss";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { getResultSetById } from "@/features/ResultList/slices/resultsSlice";
import { getQueryStatusById } from "@/features/ResultList/slices/queryStatusSlice";
import { getDataFromQueryVar } from "@/features/Core/utils/urlHelpers";
import { getFormattedNodeName, formatBiolinkEntity, capitalizeAllWords } from "@/features/Core/utils/stringFormatters";
import { getNodeIcon } from "@/features/Core/utils/entityLinks";
import { useDecodedParams } from "@/features/Core/hooks/useDecodedParams";
import Tabs from "@/features/Core/components/Tabs/Tabs";
import Tab from "@/features/Core/components/Tabs/Tab";
import { formatLabel, getNodeBiolinkLink, renderValue } from "@/features/NodeInformationView/utils/utilities";
import useNodeTypeDefinition from "@/features/NodeInformationView/hooks/useNodeTypeDefinition";
import NodeViewSkeleton from "@/features/NodeInformationView/components/NodeViewSkeleton/NodeViewSkeleton";
import ViewNotFound from "@/features/Navigation/components/ViewNotFound/ViewNotFound";
import SafeHtmlHighlighter from "@/features/Core/components/SafeHtmlHighlighter/SafeHtmlHighlighter";
import ClinicalTrialsAnnotation from "@/features/NodeInformationView/components/ClinicalTrialsAnnotation/ClinicalTrialsAnnotation";
import ResultListTopBar from "@/features/ResultList/components/ResultListTopBar/ResultListTopBar";
import { AnnotationSource, ChebiRole, Indication, ResultNode } from "@/features/ResultList/types/results";
import ExternalLink from "@/assets/icons/buttons/External Link.svg?react";
import { joinClasses } from "@/features/Core/utils/classHelpers";

interface AnnotationOverrideProps {
  value: unknown;
  nodeName: string;
  nodeType: string;
}

const ClinicalTrials: FC<AnnotationOverrideProps> = ({ value, nodeName, nodeType }) => (
  <ClinicalTrialsAnnotation nctIds={value as string[]} nodeName={nodeName} nodeType={nodeType ?? ""} />
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
  if(typeof fullName !== "string" || fullName.length === 0) return null;
  return capitalizeAllWords(fullName);
};

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

/**
 * Renders the linkouts for an annotation section's sources. Duplicate and
 * url-less sources are dropped, and nothing is rendered when none remain.
 */
const SourceLinks: FC<{ sources: AnnotationSource[] | undefined }> = ({ sources }) => {
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
        links.map(({ name, url }) => (
          <a key={url} href={url} target="_blank" rel="noreferrer" className={styles.sourceLink}>
            {name || url}<ExternalLink/>
          </a>
        ))
      }
    </div>
  );
};

const NodeInformationView: FC = () => {
  const { nodeId } = useParams();
  const decodedParams = useDecodedParams();
  const queryId = getDataFromQueryVar("q", decodedParams);
  const resultSet = useSelector(getResultSetById(queryId));
  const queryStatus = useSelector(getQueryStatusById(queryId));

  const node = nodeId ? resultSet?.data?.nodes?.[nodeId] ?? null : null;
  const nodeType = useMemo(() => node?.types[0] ?? null, [node?.types]);
  const nodeName = useMemo(() => getFormattedNodeName(node?.names[0] ?? undefined, nodeType ?? null), [node?.names, nodeType]);
  const nodeBiolinkLink = node ? getNodeBiolinkLink(node) : "https://biolink.github.io/biolink-model/";
  
  const { data: nodeTypeDefinition } = useNodeTypeDefinition(nodeType);

  const geneFullName = useMemo(() => getGeneFullName(node), [node]);

  const annotationFields = useMemo<{label: string; content: ReactNode; sources: AnnotationSource[]}[]>(() => {
    if(!node || !node.annotations) return [];
    const fields: {label: string; content: ReactNode; sources: AnnotationSource[]}[] = [];
    for(const [categoryKey, category] of Object.entries(node.annotations)) {
      for(const [key, section] of Object.entries(category)) {
        if(isExcludedAnnotation(categoryKey, key) || section === null || section === undefined) continue;
        const value = section.value;
        const sources = section.metadata?.sources ?? [];
        const Override = ANNOTATION_OVERRIDES[categoryKey]?.[key];
        if(Override) {
          fields.push({ label: formatLabel(key), content: <Override value={value} nodeName={nodeName ?? ""} nodeType={nodeType ?? ""} />, sources });
          continue;
        }
        const content = renderValue(value);
        if(content !== null) fields.push({ label: formatLabel(key), content, sources });
      }
    }
    return fields;
  }, [node, nodeName, nodeType]);

  const description = useMemo<{text: string; sources: AnnotationSource[]} | null>(() => {
    if(!node || !node.annotations) return null;
    for(const key in node.annotations) {
      const annotation = node.annotations[key as keyof typeof node.annotations];
      const section = annotation.descriptions;
      const descriptions = section?.value;
      if(descriptions && descriptions.length > 0)
        return { text: descriptions[0], sources: section?.metadata?.sources ?? [] };
    }
    if(node.descriptions.length > 0)
      return { text: node.descriptions[0], sources: [] };

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
      <ResultListTopBar/>
      <div className={styles.top}>
        <div className={styles.nodeName}>
          <span className={styles.nodeTypeIcon}>{getNodeIcon(nodeType || "")} {formatBiolinkEntity(nodeType || "")}</span>
          <h5 className={joinClasses(styles.nodeTitle, !!geneFullName && styles.nodeTitleWithFullName)}>{nodeName}</h5>
          {geneFullName && <p className={styles.nodeFullName}>{geneFullName}</p>}
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
                    <div className={styles.sourceLinks}>
                      <a href={nodeBiolinkLink} target="_blank" rel="noreferrer" className={styles.sourceLink}>
                        Learn More About the Biolink Model<ExternalLink/>
                      </a>
                    </div>
                  </div>
                }
                {
                  annotationFields.map(({ label, content, sources }) => (
                    <div key={label} className={styles.section}>
                      <p className={styles.sectionTitle}>{label}</p>
                      <p className={styles.sectionContent}>{content}</p>
                      <SourceLinks sources={sources} />
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
