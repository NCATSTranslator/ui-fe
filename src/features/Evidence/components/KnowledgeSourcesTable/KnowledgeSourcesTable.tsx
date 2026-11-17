import { FC } from 'react';
import InfoIcon from '@/assets/icons/status/Alerts/Info.svg?react';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import evidenceStyles from '@/features/Evidence/components/EvidenceView/EvidenceView.module.scss';
import styles from './KnowledgeSourcesTable.module.scss';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import { getEvidenceLinkTrackingProps } from '@/features/Analytics/utils/linkTracking';
import { GroupedSource } from '@/features/Evidence/utils/utilities';

interface KnowledgeSourcesTableProps {
  /** Already grouped by name (see groupSourcesByName). */
  sources: GroupedSource[];
}

const KnowledgeSourcesTable: FC<KnowledgeSourcesTableProps> = ({ sources }) => {
  return (
    <div className={joinClasses("table-body", styles.tableBody, evidenceStyles.tableBody, evidenceStyles.sources)}>
      <div className={joinClasses("table-head", evidenceStyles.tableHead)}>
        <div className={joinClasses("head", evidenceStyles.head)}>Source</div>
        <div className={joinClasses("head", evidenceStyles.head)}>Rationale</div>
      </div>
      <div className={joinClasses("table-items", evidenceStyles.tableItems, "scrollable")}>
        {sources.map((src, i) => {
          const sourceKey = `${src.name}-${i}`;
          const tooltipId = `source-tooltip-${sourceKey}`;

          return (
            <div className={joinClasses("table-item", styles.tableItem, evidenceStyles.tableItem)} key={sourceKey}>
              {src.wiki ? (
                <Tooltip id={tooltipId}>
                  <span className={evidenceStyles.tooltipSpan}>
                    <a href={src.wiki} target="_blank" rel="noreferrer" {...getEvidenceLinkTrackingProps('source', src.wiki)}>
                      Why do we use this source?
                    </a>
                  </span>
                </Tooltip>
              ) : null}
              <span className={joinClasses("table-cell", styles.sourceName, evidenceStyles.cell, evidenceStyles.source, evidenceStyles.sourceItem)}>
                <span className={styles.sourceNameText}>
                  {src.name}
                  {src.wiki && <InfoIcon className={evidenceStyles.infoIcon} data-tooltip-id={tooltipId} />}
                </span>
              </span>
              <span className={joinClasses("table-cell", evidenceStyles.cell, evidenceStyles.link, evidenceStyles.sourceItem)}>
                {src.urls.length > 0 ? (
                  <div className={styles.urlGrid}>
                    {src.urls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        {...getEvidenceLinkTrackingProps('source', url)}
                        className={joinClasses("url", evidenceStyles.edgeProvenanceLink)}
                      >
                        {url}
                      </a>
                    ))}
                  </div>
                ) : (
                  <span>No link available</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KnowledgeSourcesTable;
