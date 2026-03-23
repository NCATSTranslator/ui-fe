import { FC, useMemo } from 'react';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import InfoIcon from '@/assets/icons/status/Alerts/Info.svg?react';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import { Provenance } from '@/features/Evidence/types/evidence.d';
import evidenceStyles from '@/features/Evidence/components/EvidenceView/EvidenceView.module.scss';
import styles from './KnowledgeSourcesTable.module.scss';

interface KnowledgeSourcesTableProps {
  sources: Provenance[];
}

type GroupedSource = {
  name: string;
  wiki?: string;
  urls: string[];
};

const KnowledgeSourcesTable: FC<KnowledgeSourcesTableProps> = ({ sources }) => {
  const groupedSources = useMemo<GroupedSource[]>(() => {
    const byName = new Map<string, GroupedSource>();

    sources.forEach((src) => {
      const key = src.name?.trim();
      if (!key) return;

      const existing = byName.get(key);
      if (!existing) {
        byName.set(key, {
          name: key,
          wiki: src.wiki || undefined,
          urls: src.url ? [src.url] : [],
        });
        return;
      }

      if (!existing.wiki && src.wiki) existing.wiki = src.wiki;
      if (src.url && !existing.urls.includes(src.url)) {
        existing.urls.push(src.url);
      }
    });

    return Array.from(byName.values());
  }, [sources]);

  return (
    <div className={`table-body ${evidenceStyles.tableBody} ${evidenceStyles.sources}`}>
      <div className={`table-head ${evidenceStyles.tableHead}`}>
        <div className={`head ${evidenceStyles.head}`}>Source</div>
        <div className={`head ${evidenceStyles.head}`}>Rationale</div>
      </div>
      <div className={`table-items ${evidenceStyles.tableItems} scrollable`}>
        {groupedSources.map((src, i) => {
          const sourceKey = `${src.name}-${i}`;
          const tooltipId = `source-tooltip-${sourceKey}`;

          return (
            <div className={`table-item ${evidenceStyles.tableItem}`} key={sourceKey}>
              {src.wiki ? (
                <Tooltip id={tooltipId}>
                  <span className={evidenceStyles.tooltipSpan}>
                    <a href={src.wiki} target="_blank" rel="noreferrer">
                      Why do we use this source?
                      <ExternalLink />
                    </a>
                  </span>
                </Tooltip>
              ) : null}
              <span className={`table-cell ${evidenceStyles.cell} ${evidenceStyles.source} ${evidenceStyles.sourceItem}`}>
                {src.name}
                {src.wiki && <InfoIcon className={evidenceStyles.infoIcon} data-tooltip-id={tooltipId} />}
              </span>
              <span className={`table-cell ${evidenceStyles.cell} ${evidenceStyles.link} ${evidenceStyles.sourceItem}`}>
                {src.urls.length > 0 ? (
                  <div className={styles.urlGrid}>
                    {src.urls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className={`url ${evidenceStyles.edgeProvenanceLink}`}
                      >
                        {url}
                        <ExternalLink />
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
