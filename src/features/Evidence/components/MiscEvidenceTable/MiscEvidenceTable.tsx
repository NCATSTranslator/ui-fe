import { FC } from 'react';
import { Preferences } from '@/features/UserAuth/types/user';
import { usePagination } from '@/features/Core/hooks/usePagination';
import { getInitItemsPerPage } from '@/features/Evidence/utils/evidenceModalFunctions';
import { DEFAULT_ITEMS_PER_PAGE } from '@/features/Evidence/hooks/evidenceHooks';
import TablePaginationControls from '@/features/Evidence/components/TablePaginationControls/TablePaginationControls';
import PaginationSummary from '@/features/Evidence/components/PaginationSummary/PaginationSummary';
import styles from '@/features/Evidence/components/EvidenceView/EvidenceView.module.scss';
import { FormattedMiscEvidence } from '@/features/Evidence/utils/utilities';

interface MiscEvidenceTableProps {
  /** Already deduplicated by URL (see formatMiscEvidence). */
  miscEvidence: FormattedMiscEvidence[];
  prefs: Preferences;
}

const MiscEvidenceTable: FC<MiscEvidenceTableProps> = ({ miscEvidence, prefs }) => {
  const {
    itemsPerPage,
    currentPage,
    itemOffset,
    endOffset,
    displayedItems,
    pageCount,
    handlePageClick,
    handleItemsPerPageChange,
  } = usePagination(miscEvidence, getInitItemsPerPage(prefs, DEFAULT_ITEMS_PER_PAGE));

  return (
    <>
      <PaginationSummary
        itemOffset={itemOffset}
        endOffset={endOffset}
        totalCount={miscEvidence.length}
        label="Miscellaneous Evidence"
      />
      <div className={`table-body ${styles.tableBody} ${styles.misc}`}>
        <div className={`table-head ${styles.tableHead}`}>
          <div className={`head ${styles.head} ${styles.link}`}>Link</div>
        </div>
        <div className={`table-items ${styles.tableItems} scrollable`}>
          {displayedItems.map((item) => {
            return (
              <div className={`table-item ${styles.tableItem}`} key={item.id}>
                <div className={`table-cell ${styles.cell} ${styles.link} link`}>
                  {item.url && (
                    <a href={item.url} rel="noreferrer" target="_blank">
                      {item.url}
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <TablePaginationControls
        label="Links per Page"
        tabName="Miscellaneous"
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        pageCount={pageCount}
        onItemsPerPageChange={handleItemsPerPageChange}
        onPageChange={handlePageClick}
      />
    </>
  );
};

export default MiscEvidenceTable;
