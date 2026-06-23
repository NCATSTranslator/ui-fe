import { FC } from 'react';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import { getFormattedDate } from '@/features/Core/utils/dateHelpers';
import { TrialObject } from '@/features/Evidence/types/evidence.d';
import { getUrlByType } from '@/features/Evidence/utils/utilities';
import { Preferences } from '@/features/UserAuth/types/user';
import { usePagination } from '@/features/Evidence/hooks/usePagination';
import TablePaginationControls from '@/features/Evidence/components/TablePaginationControls/TablePaginationControls';
import PaginationSummary from '@/features/Evidence/components/PaginationSummary/PaginationSummary';
import styles from '@/features/Evidence/components/EvidenceView/EvidenceView.module.scss';

interface ClinicalTrialsTableProps {
  clinicalTrials: TrialObject[];
  prefs: Preferences;
}

const ClinicalTrialsTable: FC<ClinicalTrialsTableProps> = ({ clinicalTrials, prefs }) => {
  const {
    itemsPerPage,
    currentPage,
    itemOffset,
    endOffset,
    displayedItems,
    pageCount,
    handlePageClick,
    handleItemsPerPageChange,
  } = usePagination(clinicalTrials, prefs);

  return (
    <>
      <PaginationSummary
        itemOffset={itemOffset}
        endOffset={endOffset}
        totalCount={clinicalTrials.length}
        label="Clinical Trials"
      />
      <div className={`table-body ${styles.tableBody} ${styles.clinicalTrials}`}>
        <div className={`table-head ${styles.tableHead}`}>
          <div className={`head ${styles.head}`}>Title</div>
          <div className={`head ${styles.head}`}>Start Date</div>
          <div className={`head ${styles.head}`}>Phase</div>
          <div className={`head ${styles.head}`}>Status</div>
          <div className={`head ${styles.head}`}>Participants</div>
        </div>
        <div className={`table-items ${styles.tableItems} scrollable`}>
          {displayedItems.map((item, i) => {
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
      <TablePaginationControls
        label="Trials per Page"
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        pageCount={pageCount}
        onItemsPerPageChange={handleItemsPerPageChange}
        onPageChange={handlePageClick}
      />
    </>
  );
};

export default ClinicalTrialsTable;
