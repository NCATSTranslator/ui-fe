import { FC, KeyboardEvent, useMemo } from 'react';
import PathViewSection from '@/features/Evidence/components/PathViewSection/PathViewSection';
import EvidenceTabs from '@/features/Evidence/components/EvidenceTabs/EvidenceTabs';
import EvidenceDownloadButton from '@/features/Evidence/components/EvidenceDownloadButton/EvidenceDownloadButton';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import ViewTopBar from '@/features/Navigation/components/ViewTopBar/ViewTopBar';
import FilteredOutWrapper from '@/features/Core/components/FilteredOutWrapper/FilteredOutWrapper';
import { EvidenceViewContentProps } from '@/features/Evidence/hooks/useEvidenceView';
import { usePubTableState } from '@/features/Evidence/hooks/evidenceHooks';
import { buildEdgeEvidence, hasEdgeEvidence } from '@/features/Evidence/utils/utilities';
import styles from './EvidenceView.module.scss';

const EvidenceViewContent: FC<EvidenceViewContentProps> = ({
  edgeLabel,
  evidenceSubtitle,
  edgeSeen,
  handleToggleSeen,
  path,
  compressedSubgraph,
  handleEdgeClick,
  pk,
  selectedEdge,
  selectedEdgeDomRef,
  isFilteredOut,
  onClearFilters,
  publications,
  setPublications,
  clinicalTrials,
  miscEvidence,
  sources,
  prefs,
  initialTab,
  isCanvasOnlyMode,
}) => {
  // Derived once here so the tabs, the tables, and the download all use the same lists.
  const evidence = useMemo(
    () => buildEdgeEvidence({ publications, clinicalTrials, miscEvidence, sources }),
    [publications, clinicalTrials, miscEvidence, sources],
  );

  // The publications table fills in titles, journals, dates, and snippets from
  // PubMed after it mounts. Its state lives here so the download can wait for that.
  const [pubTableState, updatePubTableState] = usePubTableState();
  const isPublicationDataLoading = publications.length > 0 && pubTableState.isLoading;

  const handleToggleSeenKeyDown = (event: KeyboardEvent<HTMLParagraphElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggleSeen();
    }
  };

  return (
  <div className={styles.evidenceViewWrapper}>
    <ViewTopBar
      actions={hasEdgeEvidence(evidence) ? (
        <EvidenceDownloadButton
          evidence={evidence}
          edgeLabel={edgeLabel}
          selectedEdge={selectedEdge}
          isLoading={isPublicationDataLoading}
        />
      ) : undefined}
    />
    <FilteredOutWrapper
      isFilteredOut={isFilteredOut}
      message="This path has been filtered out."
      onClearFilters={onClearFilters}
      className={styles.evidenceContent}
    >
      <div className={styles.evidenceView}>
        <h5 className={styles.title}>
          {edgeLabel}
        </h5>
        <div className={styles.labelContainer}>
          {evidenceSubtitle && (
            <>
              <p className={styles.subtitle}>{evidenceSubtitle}</p>
              {!isCanvasOnlyMode && <span className={styles.sep}>·</span>}
            </>
          )}
          {!isCanvasOnlyMode && (
            <p
              className={styles.toggleSeen}
              onClick={handleToggleSeen}
              onKeyDown={handleToggleSeenKeyDown}
              role="button"
              tabIndex={0}
            >
              Mark as {edgeSeen ? "Unseen" : "Seen"}
            </p>
          )}
        </div>
        <Tooltip id="knowledge-sources-tooltip">
          <span>The resources that provided the information supporting the selected relationship.</span>
        </Tooltip>
        {path && (
          <PathViewSection
            path={path}
            compressedSubgraph={compressedSubgraph}
            handleEdgeClick={handleEdgeClick}
            isOpen={true}
            pk={pk}
            selectedEdge={selectedEdge}
            selectedEdgeRef={selectedEdgeDomRef}
          />
        )}
        <EvidenceTabs
          isOpen={true}
          evidence={evidence}
          setPublications={setPublications}
          pubTableState={pubTableState}
          updatePubTableState={updatePubTableState}
          selectedEdge={selectedEdge}
          pk={pk}
          prefs={prefs}
          initialTab={initialTab}
        />
      </div>
    </FilteredOutWrapper>
  </div>
  );
};

export default EvidenceViewContent;
