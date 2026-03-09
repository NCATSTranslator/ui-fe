import { FC, ReactNode, useMemo } from "react";
import styles from "./NodeInformationView.module.scss";
import { ResultNode } from "@/features/ResultList/types/results";
import Tabs from "@/features/Common/components/Tabs/Tabs";
import Tab from "@/features/Common/components/Tabs/Tab";
import { formatBiolinkEntity, getNodeIcon } from "@/features/Common/utils/utilities";
import Button from "@/features/Core/components/Button/Button";
import ChevLeftIcon from '@/assets/icons/directional/Chevron/Chevron Left.svg?react';
import { joinClasses } from "@/features/Common/utils/utilities";
import { useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";
import { formatLabel, renderValue } from "@/features/NodeInformationView/utils/utilities";
import useNodeTypeDefinition from "@/features/NodeInformationView/hooks/useNodeTypeDefinition";

interface NodeInformationViewProps {
  backFunction: () => void;
  backLabel: string;
  node: ResultNode | null;
}

const NodeInformationView: FC<NodeInformationViewProps> = ({
  backFunction,
  backLabel,
  node
}) => {

  const nodeType = node?.types[0] ?? null;
  const nodeName = node?.names[0] ?? null;
  
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

  const { activePanelId } = useSidebar();

  return (
    <div className={joinClasses(styles.nodeInformationView, !node && styles.hidden, activePanelId !== 'none' && styles.panelIsOpen)}>
      <div className={styles.container}>
        <div className={styles.back}>
          <Button
            variant="textOnly"
            iconLeft={<ChevLeftIcon />}
            handleClick={backFunction}
            className={styles.backButton}
          >
            {backLabel}
          </Button>
        </div>
        <div className={styles.top}>
          <div className={styles.nodeType}>
            <span className={styles.nodeTypeIcon}>{getNodeIcon(nodeType || "")} {formatBiolinkEntity(nodeType || "")}</span>
            <h5 className={styles.nodeTypeTitle}>{nodeName}</h5>
          </div>
        </div>
        <Tabs className={styles.tabs} fadeClassName={styles.tabFade}>
          {
            [
              <Tab heading="Information" className={styles.tabContent} key="information">
                <div className={styles.information}>
                  {
                    description &&
                    <div className={styles.section}>
                      <p className={styles.sectionTitle}>Description</p>
                      <p className={styles.description}>{description}</p>
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
    </div>
  );
};

export default NodeInformationView;