import { FC, useMemo } from 'react';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import { PublicationObject } from '@/features/Evidence/types/evidence.d';
import { Preferences } from '@/features/UserAuth/types/user';
import { usePagination } from '@/features/Core/hooks/usePagination';
import { getInitItemsPerPage } from '@/features/Evidence/utils/evidenceModalFunctions';
import { DEFAULT_ITEMS_PER_PAGE } from '@/features/Evidence/hooks/evidenceHooks';
import TablePaginationControls from '@/features/Evidence/components/TablePaginationControls/TablePaginationControls';
import PaginationSummary from '@/features/Evidence/components/PaginationSummary/PaginationSummary';
import styles from '@/features/Evidence/components/EvidenceView/EvidenceView.module.scss';

interface MiscEvidenceTableProps {
  miscEvidence: PublicationObject[];
  prefs: Preferences;
}

interface FormattedMiscEvidence {
  id: string;
  url: string;
}

/**
 * Formats the misc evidence by removing duplicates and adding the id to the url.
 * If no url, get the url from the source
 * If item with that source url already exists, don't add it
 * @param miscEvidence {PublicationObject[]} - The misc evidence to format
 * @returns {FormattedMiscEvidence[]} - The formatted misc evidence
 */
const formatMiscEvidence = (miscEvidence: PublicationObject[]): FormattedMiscEvidence[] => {
  const seen = new Set<string>();
  const formattedMiscEvidence: FormattedMiscEvidence[] = [];

  for (const item of miscEvidence) {
    const url = item.url || item.source?.url || '';
    if (!url || seen.has(url)) continue;

    seen.add(url);
    formattedMiscEvidence.push({
      id: item.id || url,
      url,
    });
  }

  return formattedMiscEvidence;
}

const MiscEvidenceTable: FC<MiscEvidenceTableProps> = ({ miscEvidence, prefs }) => {
  const formattedMiscEvidence = useMemo(() => formatMiscEvidence(miscEvidence), [miscEvidence]);
  const {
    itemsPerPage,
    currentPage,
    itemOffset,
    endOffset,
    displayedItems,
    pageCount,
    handlePageClick,
    handleItemsPerPageChange,
  } = usePagination(formattedMiscEvidence, getInitItemsPerPage(prefs, DEFAULT_ITEMS_PER_PAGE));

  return (
    <>
      <PaginationSummary
        itemOffset={itemOffset}
        endOffset={endOffset}
        totalCount={formattedMiscEvidence.length}
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
                      {item.url} <ExternalLink />
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
