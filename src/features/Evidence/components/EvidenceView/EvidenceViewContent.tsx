import { FC, KeyboardEvent, useMemo, useState } from 'react';
import PathViewSection from '@/features/Evidence/components/PathViewSection/PathViewSection';
import { sortPublications } from '@/features/Evidence/utils/publicationSorting';
import { sortTrials } from '@/features/Evidence/components/ClinicalTrialsList/clinicalTrialHelpers';
import EvidenceGrid from '@/features/Evidence/components/EvidenceGrid/EvidenceGrid';
import EvidenceDownloadButton from '@/features/Evidence/components/EvidenceDownloadButton/EvidenceDownloadButton';
import PathStepper from '@/features/Evidence/components/PathStepper/PathStepper';
import ViewTopBar from '@/features/Navigation/components/ViewTopBar/ViewTopBar';
import FilteredOutWrapper from '@/features/Core/components/FilteredOutWrapper/FilteredOutWrapper';
import { EvidenceViewContentProps } from '@/features/Evidence/hooks/useEvidenceView';
import useEvidenceSorting from '@/features/Evidence/hooks/useEvidenceSorting';
import useEnrichedTrials from '@/features/Evidence/hooks/useEnrichedTrials';
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
  drugLabels,
  miscEvidence,
  sources,
  prefs,
  initialSection,
  isCanvasOnlyMode,
}) => {
  // Derived once here so the sections and the download all use the same lists. Publications and
  // trials are put in order here too, so the download follows the order chosen in each sort menu.
  // Trials are ordered after enrichment, since a title or start date may only arrive with it.
  const sorting = useEvidenceSorting(prefs?.evidence_sort?.pref_value);
  const publicationSort = sorting.publications.value;
  const trialSort = sorting.clinicalTrials.value;
  const {
    trials: enrichedTrials,
    metadata: trialMetadata,
    isLoading: isTrialDataLoading,
  } = useEnrichedTrials(clinicalTrials);
  // Each list is ordered on its own, so trial details arriving does not hand the publications
  // list a new array, which would restart its PubMed fetch.
  const sortedPublications = useMemo(
    () => sortPublications(publications, publicationSort),
    [publications, publicationSort],
  );
  const sortedTrials = useMemo(() => sortTrials(enrichedTrials, trialSort), [enrichedTrials, trialSort]);
  const evidence = useMemo(
    () => buildEdgeEvidence({
      publications: sortedPublications,
      clinicalTrials: sortedTrials,
      drugLabels,
      miscEvidence,
      sources,
    }),
    [sortedPublications, sortedTrials, drugLabels, miscEvidence, sources],
  );

  // The publications list fills in titles, journals, dates, and snippets from
  // PubMed after it mounts. Its loading flag lives here so the download can wait for that.
  const [isPubmedLoading, setIsPubmedLoading] = useState(true);
  const isPublicationDataLoading = publications.length > 0 && isPubmedLoading;

  const handleToggleSeenKeyDown = (event: KeyboardEvent<HTMLParagraphElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggleSeen();
    }
  };

  return (
  <div className={styles.evidenceViewWrapper}>
    <ViewTopBar
      // Only an edge reached through a result's path has neighbouring paths to step to.
      stepper={path && !isCanvasOnlyMode ? <PathStepper /> : undefined}
      actions={hasEdgeEvidence(evidence) ? (
        <EvidenceDownloadButton
          evidence={evidence}
          edgeLabel={edgeLabel}
          selectedEdge={selectedEdge}
          isLoading={isPublicationDataLoading || isTrialDataLoading}
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
        <EvidenceGrid
          evidence={evidence}
          trialMetadata={trialMetadata}
          setPublications={setPublications}
          isPublicationDataLoading={isPubmedLoading}
          setIsPublicationDataLoading={setIsPubmedLoading}
          selectedEdge={selectedEdge}
          pk={pk}
          sorting={sorting}
          initialSection={initialSection}
        />
      </div>
    </FilteredOutWrapper>
  </div>
  );
};

export default EvidenceViewContent;
