import { FC } from 'react';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import { getFormattedDate } from '@/features/Common/utils/utilities';
import { TrialObject } from '@/features/Evidence/types/evidence.d';
import { getUrlByType } from '@/features/Evidence/utils/utilities';
import styles from '@/features/Evidence/components/EvidenceView/EvidenceView.module.scss';

interface ClinicalTrialsTableProps {
  clinicalTrials: TrialObject[];
}

const ClinicalTrialsTable: FC<ClinicalTrialsTableProps> = ({ clinicalTrials }) => (
  <div className={`table-body ${styles.tableBody} ${styles.clinicalTrials}`}>
    <div className={`table-head ${styles.tableHead}`}>
      <div className={`head ${styles.head}`}>Title</div>
      <div className={`head ${styles.head}`}>Start Date</div>
      <div className={`head ${styles.head}`}>Phase</div>
      <div className={`head ${styles.head}`}>Status</div>
      <div className={`head ${styles.head}`}>Participants</div>
    </div>
    <div className={`table-items ${styles.tableItems} scrollable`}>
      {clinicalTrials.map((item, i) => {
        const url = item.url || (item.id ? getUrlByType(item.id, 'NCT') : '');
        const title = item.title;
        const startDate = item.start_date;
        const phase = item.phase;
        const participants = item.size;
        const type = item.type;
        const status = item.status;

        return (
          <div className={styles.tableItem} key={item.id || i}>
            <div className={`table-cell ${styles.cell} ${styles.link} link`}>
              {url && (
                <a href={url} rel="noreferrer" target="_blank">
                  {title || url} <ExternalLink />
                </a>
              )}
            </div>
            <div className={`table-cell ${styles.cell}`}>
              {startDate ? getFormattedDate(new Date(startDate), false) : ''}
            </div>
            <div className={`table-cell ${styles.cell}`}>{phase}</div>
            <div className={`table-cell ${styles.cell}`}>{status}</div>
            <div className={`table-cell ${styles.cell}`}>
              {participants} {type || ''}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default ClinicalTrialsTable;
