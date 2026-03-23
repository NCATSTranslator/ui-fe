import { FC } from 'react';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import InfoIcon from '@/assets/icons/status/Alerts/Info.svg?react';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import { Provenance } from '@/features/Evidence/types/evidence.d';
import styles from '@/features/Evidence/components/EvidenceView/EvidenceView.module.scss';

interface KnowledgeSourcesTableProps {
  sources: Provenance[];
}

const KnowledgeSourcesTable: FC<KnowledgeSourcesTableProps> = ({ sources }) => (
  <div className={`table-body ${styles.tableBody} ${styles.sources}`}>
    <div className={`table-head ${styles.tableHead}`}>
      <div className={`head ${styles.head}`}>Source</div>
      <div className={`head ${styles.head}`}>Rationale</div>
    </div>
    <div className={`table-items ${styles.tableItems} scrollable`}>
      {sources.map((src, i) => {
        const sourceKey = `${src.url}-${i}`;
        const tooltipId = `source-tooltip-${sourceKey}`;

        return (
          <div className={`table-item ${styles.tableItem}`} key={sourceKey}>
            <Tooltip id={tooltipId}>
              <span className={styles.tooltipSpan}>
                <a href={src?.wiki} target="_blank" rel="noreferrer">
                  Why do we use this source?
                  <ExternalLink />
                </a>
              </span>
            </Tooltip>
            <span className={`table-cell ${styles.cell} ${styles.source} ${styles.sourceItem}`}>
              {src.name}
              {src?.wiki && <InfoIcon className={styles.infoIcon} data-tooltip-id={tooltipId} />}
            </span>
            <span className={`table-cell ${styles.cell} ${styles.link} ${styles.sourceItem}`}>
              {src?.url ? (
                <a href={src.url} target="_blank" rel="noreferrer" className={`url ${styles.edgeProvenanceLink}`}>
                  {src.url}
                  <ExternalLink />
                </a>
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

export default KnowledgeSourcesTable;
