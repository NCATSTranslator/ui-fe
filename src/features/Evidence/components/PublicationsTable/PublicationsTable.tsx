import { useEffect, useCallback, useMemo, FC, Dispatch, SetStateAction } from 'react';
import LoadingBar from "@/features/Common/components/LoadingBar/LoadingBar";
import styles from './PublicationsTable.module.scss';
import { handleEvidenceSort, getInitItemsPerPage } from "@/features/Evidence/utils/evidenceModalFunctions";
import { Preferences } from '@/features/UserAuth/types/user';
import { PublicationObject, EvidenceSortState, KnowledgeLevelFilterType } from '@/features/Evidence/types/evidence';
import { ResultEdge } from '@/features/ResultList/types/results';
import { getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { useSelector } from 'react-redux';
import { DEFAULT_ITEMS_PER_PAGE, usePubmedDataFetch, usePubTableState } from '@/features/Evidence/hooks/evidenceHooks';
import KnowledgeLevelFilter from '@/features/Evidence/components/KnowledgeLevelFilter/KnowledgeLevelFilter';
import PublicationsTableHeader from '@/features/Evidence/components/PublicationsTableHeader/PublicationsTableHeader';
import PublicationRow from '@/features/Evidence/components/PublicationRow/PublicationRow';
import PublicationPaginationControls from '@/features/Evidence/components/PublicationPaginationControls/PublicationPaginationControls';

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
  const [state, updateState] = usePubTableState(prefs);
  usePubmedDataFetch(
    isOpen,
    publications,
    selectedEdgeId,
    prefs,
    setPublications,
    updateState
  );

  const availableKnowledgeLevels = useMemo(() => {
    return new Set(publications.map(pub => pub.knowledgeLevel).filter((level): level is string => level !== undefined));
  }, [publications]);

  const filteredEvidence = useMemo(() => {
    if (state.knowledgeLevelFilter === 'all') return publications;
    return publications.filter(evidence => evidence.knowledgeLevel === state.knowledgeLevelFilter);
  }, [publications, state.knowledgeLevelFilter]);

  const endOffset = Math.min(state.itemOffset + state.itemsPerPage, filteredEvidence.length);
  const displayedPublications = useMemo(() => {
    return filteredEvidence.slice(state.itemOffset, endOffset);
  }, [filteredEvidence, state.itemOffset, endOffset]);

  const pageCount = useMemo(() => {
    return Math.ceil(filteredEvidence.length / state.itemsPerPage);
  }, [filteredEvidence.length, state.itemsPerPage]);

  // Event handlers
  const handlePageClick = useCallback((event: { selected: number }) => {
    const newOffset = (event.selected * state.itemsPerPage) % filteredEvidence.length;
    updateState({ currentPage: event.selected, itemOffset: newOffset });
  }, [state.itemsPerPage, filteredEvidence.length, updateState]);

  const handleKnowledgeLevelFilter = useCallback((knowledgeLevel: KnowledgeLevelFilterType) => {
    updateState({
      currentPage: 0,
      itemOffset: 0,
      knowledgeLevelFilter: knowledgeLevel,
    });
  }, [updateState]);

  const handleItemsPerPageChange = useCallback((value: number) => {
    updateState({ itemsPerPage: value, currentPage: 0, itemOffset: 0 });
  }, [updateState]);

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

  useEffect(() => {
    const value = getInitItemsPerPage(prefs, DEFAULT_ITEMS_PER_PAGE);
    updateState({ itemsPerPage: value });
  }, [prefs, updateState]);

  if (!resultSet) {
    console.warn('Unable to display publications table, no result set available');
    return null;
  }

  return (
    <div className={styles.publicationsTableContainer}>
      <div className={styles.top}>
        <p className={styles.evidenceCount}>
          {filteredEvidence.length > 0
            ? `Showing ${state.itemOffset + 1}-${endOffset} of ${filteredEvidence.length} ${
                filteredEvidence.length !== publications.length ? `(${publications.length}) ` : ''
              }Publications`
            : `Showing 0-0 of 0 (${publications.length}) Publications`
          }
        </p>
        <KnowledgeLevelFilter
          filter={state.knowledgeLevelFilter}
          availableLevels={availableKnowledgeLevels}
          onFilterChange={handleKnowledgeLevelFilter}
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

      <PublicationPaginationControls
        itemsPerPage={state.itemsPerPage}
        currentPage={state.currentPage}
        pageCount={pageCount}
        onItemsPerPageChange={handleItemsPerPageChange}
        onPageChange={handlePageClick}
      />
    </div>
  );
};

export default PublicationsTable;