import { FC } from 'react';
import PathViewSection from '@/features/Evidence/components/PathViewSection/PathViewSection';
import EvidenceTabs from '@/features/Evidence/components/EvidenceTabs/EvidenceTabs';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import ResultListTopBar from '@/features/ResultList/components/ResultListTopBar/ResultListTopBar';
import FilteredOutWrapper from '@/features/Core/components/FilteredOutWrapper/FilteredOutWrapper';
import { EvidenceViewContentProps } from '@/features/Evidence/hooks/useEvidenceView';
import styles from './EvidenceView.module.scss';

const EvidenceViewContent: FC<EvidenceViewContentProps> = ({
  edgeLabel,
  pathKey,
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
}) => (
  <div className={styles.evidenceViewWrapper}>
    <ResultListTopBar />
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
          {edgeLabel && <p className={styles.subtitle}> Path {pathKey} Evidence</p>}
          <span className={styles.sep}>·</span>
          <p className={styles.toggleSeen} onClick={handleToggleSeen} role="button" tabIndex={0}>
            Mark as {edgeSeen ? "Unseen" : "Seen"}
          </p>
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
          publications={publications}
          setPublications={setPublications}
          clinicalTrials={clinicalTrials}
          miscEvidence={miscEvidence}
          sources={sources}
          selectedEdge={selectedEdge}
          pk={pk}
          prefs={prefs}
          initialTab={initialTab}
        />
      </div>
    </FilteredOutWrapper>
  </div>
);

export default EvidenceViewContent;
