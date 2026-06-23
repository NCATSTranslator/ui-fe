import { useEffect, useCallback, useRef, FC, Dispatch, SetStateAction } from 'react';
import LoadingBar from "@/features/Core/components/LoadingBar/LoadingBar";
import styles from './PublicationsTable.module.scss';
import { handleEvidenceSort } from "@/features/Evidence/utils/evidenceModalFunctions";
import { Preferences } from '@/features/UserAuth/types/user';
import { PublicationObject, EvidenceSortState } from '@/features/Evidence/types/evidence';
import { ResultEdge } from '@/features/ResultList/types/results';
import { getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { useSelector } from 'react-redux';
import { usePubmedDataFetch, usePubTableState } from '@/features/Evidence/hooks/evidenceHooks';
import { usePagination } from '@/features/Core/hooks/usePagination';
import { getInitItemsPerPage } from '@/features/Evidence/utils/evidenceModalFunctions';
import { DEFAULT_ITEMS_PER_PAGE } from '@/features/Evidence/hooks/evidenceHooks';
import PublicationsTableHeader from '@/features/Evidence/components/PublicationsTableHeader/PublicationsTableHeader';
import PublicationRow from '@/features/Evidence/components/PublicationRow/PublicationRow';
import TablePaginationControls from '@/features/Evidence/components/TablePaginationControls/TablePaginationControls';
import PaginationSummary from '@/features/Evidence/components/PaginationSummary/PaginationSummary';

interface PublicationsTableProps {
  isOpen: boolean;
  pk: string;
  prefs: Preferences;
  publications: PublicationObject[];
  selectedEdge: ResultEdge | null;
  setPublications: Dispatch<SetStateAction<PublicationObject[]>>
}

const PublicationsTable: FC<PublicationsTableProps> = ({ 
  isOpen,
  pk,
  prefs,
  publications,
  selectedEdge,
  setPublications,
}) => {
  const resultSet = useSelector(getResultSetById(pk));
  const selectedEdgeId = selectedEdge?.id || null;
  const [state, updateState] = usePubTableState();
  const {
    itemsPerPage,
    currentPage,
    itemOffset,
    endOffset,
    displayedItems: displayedPublications,
    pageCount,
    handlePageClick,
    handleItemsPerPageChange,
    resetPage,
  } = usePagination(publications, getInitItemsPerPage(prefs, DEFAULT_ITEMS_PER_PAGE));
  usePubmedDataFetch(
    isOpen,
    publications,
    selectedEdgeId,
    prefs,
    setPublications,
    updateState
  );

  // Reset to the first page whenever the selected edge changes (skip initial mount).
  const didMountRef = useRef(false);
  useEffect(() => {
    if (didMountRef.current) resetPage();
    else didMountRef.current = true;
  }, [selectedEdgeId, resetPage]);

  const handleSort = useCallback((sortKey: string) => {
    const sortType = sortKey === 'title' 
      ? (state.sortingState.title ? 'titleHighLow' : 'titleLowHigh')
      : sortKey === 'date'
      ? (state.sortingState.date ? 'dateLowHigh' : 'dateHighLow')
      : (state.sortingState.journal ? 'journalHighLow' : 'journalLowHigh');

    const sortingStateSetter = (newState: EvidenceSortState | ((prev: EvidenceSortState) => EvidenceSortState)) => {
      if (typeof newState === 'function') {
        updateState({ sortingState: newState({ title: null, journal: null, date: null }) });
      } else {
        updateState({ sortingState: newState });
      }
    };

    handleEvidenceSort(
      sortType,
      publications,
      handlePageClick,
      sortingStateSetter,
      setPublications
    );
  }, [state.sortingState, publications, handlePageClick, updateState, setPublications]);

  if (!resultSet) {
    console.warn('Unable to display publications table, no result set available');
    return null;
  }

  return (
    <div className={styles.publicationsTableContainer}>
      <div className={styles.top}>
        <PaginationSummary
          itemOffset={itemOffset}
          endOffset={endOffset}
          totalCount={publications.length}
          label="Publications"
          className={styles.evidenceCount}
        />
      </div>

      <table className={`table-body ${styles.pubsTable}`}>
        <PublicationsTableHeader sortingState={state.sortingState} onSort={handleSort} />
        {state.isLoading ? (
          <LoadingBar
            useIcon
            className={styles.loadingBar}
            loadingText="Retrieving Evidence"
          />
        ) : (
          <tbody className="table-items">
            {displayedPublications.length === 0 ? (
              <p className={styles.noPubs}>No publications available.</p>
            ) : (
              displayedPublications.map((pub) => (
                <PublicationRow
                  key={pub.id}
                  pub={pub}
                  resultSet={resultSet}
                  selectedEdge={selectedEdge}
                />
              ))
            )}
          </tbody>
        )}
      </table>

      <TablePaginationControls
        label="Publications per Page"
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        pageCount={pageCount}
        onItemsPerPageChange={handleItemsPerPageChange}
        onPageChange={handlePageClick}
      />
    </div>
  );
};

export default PublicationsTable;