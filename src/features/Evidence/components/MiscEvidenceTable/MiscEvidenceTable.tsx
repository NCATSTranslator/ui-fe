import { FC } from 'react';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import { PublicationObject } from '@/features/Evidence/types/evidence.d';
import styles from '@/features/Evidence/components/EvidenceView/EvidenceView.module.scss';

interface MiscEvidenceTableProps {
  miscEvidence: PublicationObject[];
}

const MiscEvidenceTable: FC<MiscEvidenceTableProps> = ({ miscEvidence }) => (
  <div className={`table-body ${styles.tableBody} ${styles.misc}`}>
    <div className={`table-head ${styles.tableHead}`}>
      <div className={`head ${styles.head} ${styles.link}`}>Link</div>
    </div>
    <div className={`table-items ${styles.tableItems} scrollable`}>
      {miscEvidence.map((item, i) => {
        const url = item.url || item.source?.url;
        return (
          <div className={`table-item ${styles.tableItem}`} key={item.id || i}>
            <div className={`table-cell ${styles.cell} ${styles.link} link`}>
              {url && (
                <a href={url} rel="noreferrer" target="_blank">
                  {url} <ExternalLink />
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  </div>
);

export default MiscEvidenceTable;
