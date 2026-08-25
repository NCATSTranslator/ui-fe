import { FC, ReactNode, useMemo } from 'react';
import { getFormattedDate } from '@/features/Core/utils/dateHelpers';
import { TrialObject } from '@/features/Evidence/types/evidence.d';
import { getUrlByType } from '@/features/Evidence/utils/utilities';
import { Preferences } from '@/features/UserAuth/types/user';
import { usePagination } from '@/features/Core/hooks/usePagination';
import { getInitItemsPerPage } from '@/features/Evidence/utils/evidenceModalFunctions';
import { DEFAULT_ITEMS_PER_PAGE } from '@/features/Evidence/hooks/evidenceHooks';
import TablePaginationControls from '@/features/Evidence/components/TablePaginationControls/TablePaginationControls';
import PaginationSummary from '@/features/Evidence/components/PaginationSummary/PaginationSummary';
import useClinicalTrialMetadata, {
  ClinicalTrialMeta,
  formatTrialPhase,
} from '@/features/NodeInformationView/hooks/useClinicalTrialMetadata';
import ClinicalTrialTitleLink from '@/features/NodeInformationView/components/ClinicalTrialTitleLink/ClinicalTrialTitleLink';
import SkeletonBar from '@/features/Core/components/SkeletonBar/SkeletonBar';
import styles from '@/features/Evidence/components/EvidenceView/EvidenceView.module.scss';

interface ClinicalTrialsTableProps {
  clinicalTrials: TrialObject[];
  prefs: Preferences;
}

interface ClinicalTrialTableRowProps {
  item: TrialObject;
  meta: ClinicalTrialMeta | undefined;
  metadataLoading: boolean;
  idsNeedingMetadataSet: Set<string>;
}

const trialNeedsMetadata = (trial: TrialObject): boolean =>
  !!trial.id && (
    !trial.title ||
    !trial.start_date ||
    trial.status === 'UNKNOWN' ||
    !trial.phase ||
    !trial.size
  );

const getTrialIdsNeedingMetadata = (trials: TrialObject[]): string[] => [
  ...new Set(
    trials
      .filter(trialNeedsMetadata)
      .flatMap((trial) => (trial.id ? [trial.id] : [])),
  ),
];

const mergeTrialMetadata = (
  trial: TrialObject,
  meta: ClinicalTrialMeta | undefined,
): TrialObject => {
  if (!meta) return trial;
  return {
    ...trial,
    title: meta.title ?? trial.title,
    url: meta.url || trial.url,
    start_date: meta.startDate ?? trial.start_date,
    phase: meta.phase || trial.phase,
    status: meta.status ?? trial.status,
    size: meta.enrollmentCount ?? trial.size,
    type: meta.enrollmentType ?? trial.type,
  };
};

const getPhaseDisplay = (meta: ClinicalTrialMeta | undefined, phase: number): string => {
  if (meta?.phases.length) return formatTrialPhase(meta.phases, phase);
  if (phase) return String(phase);
  return '';
};

const renderTitleCell = (showSkeleton: boolean, url: string, title: string | undefined): ReactNode => {
  if (!url && !showSkeleton) return null;
  return (
    <ClinicalTrialTitleLink
      url={url}
      title={title}
      isLoading={showSkeleton}
      showExternalIcon
      skeletonWidth="80%"
    />
  );
};

const renderStartDateCell = (showSkeleton: boolean, startDate: string): ReactNode => {
  if (showSkeleton) return <SkeletonBar width="5em" height="1em" />;
  if (!startDate) return '';
  return getFormattedDate(new Date(startDate), false);
};

const renderPhaseCell = (showSkeleton: boolean, phase: string): ReactNode => {
  if (showSkeleton) return <SkeletonBar width="2em" height="1em" />;
  return phase;
};

const renderStatusCell = (showSkeleton: boolean, status: string): ReactNode => {
  if (showSkeleton) return <SkeletonBar width="6em" height="1em" />;
  if (status === 'UNKNOWN') return '';
  return status;
};

const renderParticipantsCell = (
  showSkeleton: boolean,
  participants: number,
  type: TrialObject['type'],
): ReactNode => {
  if (showSkeleton) return <SkeletonBar width="4em" height="1em" />;
  if (!participants) return '';
  return `${participants} ${type || ''}`.trim();
};

const ClinicalTrialTableRow: FC<ClinicalTrialTableRowProps> = ({
  item,
  meta,
  metadataLoading,
  idsNeedingMetadataSet,
}) => {
  const url = item.url || (item.id ? getUrlByType(item.id, 'NCT') : '');
  const phase = getPhaseDisplay(meta, item.phase);
  const isLoadingMetadata = metadataLoading && !!item.id && idsNeedingMetadataSet.has(item.id);

  return (
    <div className={styles.tableItem}>
      <div className={`table-cell ${styles.cell} ${styles.link} link`}>
        {renderTitleCell(isLoadingMetadata && !item.title, url, item.title)}
      </div>
      <div className={`table-cell ${styles.cell}`}>
        {renderStartDateCell(isLoadingMetadata && !item.start_date, item.start_date)}
      </div>
      <div className={`table-cell ${styles.cell}`}>
        {renderPhaseCell(isLoadingMetadata && !phase, phase)}
      </div>
      <div className={`table-cell ${styles.cell}`}>
        {renderStatusCell(isLoadingMetadata && (!item.status || item.status === 'UNKNOWN'), item.status)}
      </div>
      <div className={`table-cell ${styles.cell}`}>
        {renderParticipantsCell(isLoadingMetadata && !item.size, item.size, item.type)}
      </div>
    </div>
  );
};

const ClinicalTrialsTable: FC<ClinicalTrialsTableProps> = ({ clinicalTrials, prefs }) => {
  const idsNeedingMetadata = useMemo(
    () => getTrialIdsNeedingMetadata(clinicalTrials),
    [clinicalTrials],
  );
  const idsNeedingMetadataSet = useMemo(() => new Set(idsNeedingMetadata), [idsNeedingMetadata]);
  const { trials: fetchedMetadata, isLoading: metadataLoading } = useClinicalTrialMetadata(idsNeedingMetadata);

  const metadataById = useMemo(
    () => Object.fromEntries(fetchedMetadata.map((meta) => [meta.nctId, meta])),
    [fetchedMetadata],
  );

  const enrichedTrials = useMemo(
    () => clinicalTrials.map((trial) => {
      if (!trial.id || !trialNeedsMetadata(trial)) return trial;
      return mergeTrialMetadata(trial, metadataById[trial.id]);
    }),
    [clinicalTrials, metadataById],
  );

  const {
    itemsPerPage,
    currentPage,
    itemOffset,
    endOffset,
    displayedItems,
    pageCount,
    handlePageClick,
    handleItemsPerPageChange,
  } = usePagination(enrichedTrials, getInitItemsPerPage(prefs, DEFAULT_ITEMS_PER_PAGE));

  return (
    <>
      <PaginationSummary
        itemOffset={itemOffset}
        endOffset={endOffset}
        totalCount={enrichedTrials.length}
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
          {displayedItems.map((item, i) => (
            <ClinicalTrialTableRow
              key={item.id || i}
              item={item}
              meta={item.id ? metadataById[item.id] : undefined}
              metadataLoading={metadataLoading}
              idsNeedingMetadataSet={idsNeedingMetadataSet}
            />
          ))}
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
