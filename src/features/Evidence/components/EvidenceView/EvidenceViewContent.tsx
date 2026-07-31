import { FC, KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import PathViewSection from '@/features/Evidence/components/PathViewSection/PathViewSection';
import EvidenceTabs from '@/features/Evidence/components/EvidenceTabs/EvidenceTabs';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import ViewTopBar from '@/features/Navigation/components/ViewTopBar/ViewTopBar';
import FilteredOutWrapper from '@/features/Core/components/FilteredOutWrapper/FilteredOutWrapper';
import { EvidenceViewContentProps } from '@/features/Evidence/hooks/useEvidenceView';
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
  isInferred,
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
  const handleToggleSeenKeyDown = (event: KeyboardEvent<HTMLParagraphElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggleSeen();
    }
  };

  return (
  <div className={styles.evidenceViewWrapper}>
    <ViewTopBar />
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
        {isInferred ? (
          <div className={styles.inferredDisclaimer}>
            <p>Supporting evidence for this relationship, including intermediary connections, can be found in the next path(s).</p>
            <p>Reasoning agents that use logic and pattern recognition to find connections between objects identified this path as a possible connection between this result and your search term.</p>
            <Link to="/help#reasoner" target="_blank" rel="noreferrer">Learn More about Reasoning Agents</Link>
          </div>
        ) : (
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
        )}
      </div>
    </FilteredOutWrapper>
  </div>
  );
};

export default EvidenceViewContent;
