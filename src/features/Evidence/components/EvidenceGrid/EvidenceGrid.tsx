import { Dispatch, FC, ReactNode, SetStateAction, useEffect, useMemo, useRef } from 'react';
import EvidenceSection from '@/features/Evidence/components/EvidenceSection/EvidenceSection';
import PublicationsList from '@/features/Evidence/components/PublicationsList/PublicationsList';
import ClinicalTrialsList from '@/features/Evidence/components/ClinicalTrialsList/ClinicalTrialsList';
import EvidenceLinkList from '@/features/Evidence/components/EvidenceLinkList/EvidenceLinkList';
import DatabasesList from '@/features/Evidence/components/DatabasesList/DatabasesList';
import { PublicationObject } from '@/features/Evidence/types/evidence.d';
import { EvidenceSectionName } from '@/features/Evidence/types/navigation';
import { ResultEdge } from '@/features/ResultList/types/results.d';
import { Preferences } from '@/features/UserAuth/types/user';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import { EdgeEvidence, isAcceptedOntologyEdge } from '@/features/Evidence/utils/utilities';
import { EvidenceTypeKey } from '@/features/Evidence/utils/evidenceLabels';
import {
  EvidenceSectionCounts,
  getEvidenceLayout,
  getEvidenceSectionCounts,
  getSectionDomId,
  getSectionHeading,
  getSectionKey,
} from '@/features/Evidence/utils/evidenceSections';
import cardStyles from '@/features/Evidence/components/EvidenceSection/evidenceCards.module.scss';
import styles from './EvidenceGrid.module.scss';

const SECTION_TOOLTIPS: Partial<Record<EvidenceTypeKey, string>> = {
  sources: 'The resources that provided the information supporting the selected relationship.',
};

const ACCEPTED_ONTOLOGY_EXPLANATION = 'Based on established taxonomies and classification systems, '
  + 'relationships marked as accepted ontology are established facts in the biomedical field.';

interface EvidenceGridProps {
  /** Evidence as displayed: links deduplicated, databases grouped by name. */
  evidence: EdgeEvidence;
  setPublications: Dispatch<SetStateAction<PublicationObject[]>>;
  isPublicationDataLoading: boolean;
  setIsPublicationDataLoading: (isLoading: boolean) => void;
  selectedEdge: ResultEdge | null;
  pk: string;
  prefs: Preferences;
  /** Section to scroll to when the view opens, if it has anything in it. */
  initialSection?: EvidenceSectionName;
}

// Scrolls to the section a link asked for, once per edge. Counts are read through a ref so that
// evidence loading in afterwards does not scroll the page again. The ref is updated in an effect
// declared first, so it already holds this render's counts when the scroll effect reads it.
const useScrollToInitialSection = (
  initialSection: EvidenceSectionName | undefined,
  counts: EvidenceSectionCounts,
  edgeId: string | undefined,
) => {
  const countsRef = useRef(counts);
  useEffect(() => {
    countsRef.current = counts;
  }, [counts]);

  useEffect(() => {
    if (!initialSection || !edgeId) return;
    const key = getSectionKey(initialSection);
    if (countsRef.current[key] === 0) return;
    document.getElementById(getSectionDomId(key))?.scrollIntoView?.({ block: 'start' });
  }, [initialSection, edgeId]);
};

/**
 * The body of the evidence view: one section per evidence type the edge has, in two columns.
 * Publications, clinical trials, drug labels, and the accepted ontology explanation sit on the
 * left; miscellaneous evidence and databases sit on the right. When only one of those groups has
 * anything to show, it spans the full width.
 */
const EvidenceGrid: FC<EvidenceGridProps> = ({
  evidence,
  setPublications,
  isPublicationDataLoading,
  setIsPublicationDataLoading,
  selectedEdge,
  pk,
  prefs,
  initialSection,
}) => {
  const isAcceptedOntology = !!selectedEdge && isAcceptedOntologyEdge(selectedEdge);
  const counts = useMemo(
    () => getEvidenceSectionCounts(evidence, isAcceptedOntology),
    [evidence, isAcceptedOntology],
  );
  const { primary, secondary } = getEvidenceLayout(counts);
  useScrollToInitialSection(initialSection, counts, selectedEdge?.id);

  if (primary.length === 0 && secondary.length === 0)
    return <p className={styles.noEvidence}>No evidence is currently available for this item.</p>;

  const sectionBodies: Record<EvidenceTypeKey, () => ReactNode> = {
    publications: () => (
      <PublicationsList
        selectedEdge={selectedEdge}
        publications={evidence.publications}
        setPublications={setPublications}
        isLoading={isPublicationDataLoading}
        setIsLoading={setIsPublicationDataLoading}
        pk={pk}
        prefs={prefs}
      />
    ),
    clinicalTrials: () => <ClinicalTrialsList clinicalTrials={evidence.clinicalTrials} />,
    drugLabels: () => <EvidenceLinkList links={evidence.drugLabels} linkType="drug_label" />,
    acceptedOntologies: () => (
      <p className={joinClasses(cardStyles.card, styles.explanation)}>{ACCEPTED_ONTOLOGY_EXPLANATION}</p>
    ),
    misc: () => <EvidenceLinkList links={evidence.miscEvidence} linkType="miscellaneous" />,
    sources: () => <DatabasesList sources={evidence.sources} />,
  };

  const renderSection = (key: EvidenceTypeKey) => (
    <EvidenceSection
      key={key}
      sectionKey={key}
      heading={getSectionHeading(key, counts[key])}
      tooltip={SECTION_TOOLTIPS[key]}
    >
      {sectionBodies[key]()}
    </EvidenceSection>
  );

  return (
    <div className={joinClasses(styles.grid, primary.length > 0 && secondary.length > 0 && styles.split)}>
      {primary.length > 0 && <div className={styles.column}>{primary.map(renderSection)}</div>}
      {secondary.length > 0 && (
        <div className={joinClasses(styles.column, styles.secondary)}>{secondary.map(renderSection)}</div>
      )}
    </div>
  );
};

export default EvidenceGrid;
