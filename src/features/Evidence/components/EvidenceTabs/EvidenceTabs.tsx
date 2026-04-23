import { Dispatch, FC, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import Tabs from '@/features/Common/components/Tabs/Tabs';
import Tab from '@/features/Common/components/Tabs/Tab';
import PublicationsTable from '@/features/Evidence/components/PublicationsTable/PublicationsTable';
import ClinicalTrialsTable from '@/features/Evidence/components/ClinicalTrialsTable/ClinicalTrialsTable';
import MiscEvidenceTable from '@/features/Evidence/components/MiscEvidenceTable/MiscEvidenceTable';
import KnowledgeSourcesTable from '@/features/Evidence/components/KnowledgeSourcesTable/KnowledgeSourcesTable';
import InfoIcon from '@/assets/icons/status/Alerts/Info.svg?react';
import { PublicationObject, Provenance, TrialObject } from '@/features/Evidence/types/evidence.d';
import { ResultEdge } from '@/features/ResultList/types/results.d';
import { Preferences } from '@/features/UserAuth/types/user';
import { EvidenceTabName } from '@/features/Evidence/types/navigation';
import styles from '@/features/Evidence/components/EvidenceView/EvidenceView.module.scss';

interface EvidenceTabsProps {
  isOpen: boolean;
  publications: PublicationObject[];
  setPublications: Dispatch<SetStateAction<PublicationObject[]>>;
  clinicalTrials: TrialObject[];
  miscEvidence: PublicationObject[];
  sources: Provenance[];
  selectedEdge: ResultEdge | null;
  pk: string;
  prefs: Preferences;
  initialTab?: EvidenceTabName;
}

const tabHasData = (
  tab: EvidenceTabName,
  counts: { pubs: number; cts: number; misc: number; sources: number },
): boolean => {
  switch (tab) {
    case 'Publications': return counts.pubs > 0;
    case 'Clinical Trials': return counts.cts > 0;
    case 'Miscellaneous': return counts.misc > 0;
    case 'Knowledge Sources': return counts.sources > 0;
    default: return false;
  }
};

const getFirstTabHeading = (publicationsLength: number, clinicalTrialsLength: number, miscEvidenceLength: number): EvidenceTabName => {
  if (publicationsLength > 0) return 'Publications';
  if (clinicalTrialsLength > 0) return 'Clinical Trials';
  if (miscEvidenceLength > 0) return 'Miscellaneous';
  return 'Knowledge Sources';
};

const EvidenceTabs: FC<EvidenceTabsProps> = ({
  isOpen,
  publications,
  setPublications,
  clinicalTrials,
  miscEvidence,
  sources,
  selectedEdge,
  pk,
  prefs,
  initialTab,
}) => {

  const initialTabRef = useRef(initialTab);
  initialTabRef.current = initialTab;

  const hasEvidence = useMemo(() => 
    clinicalTrials.length > 0 || publications.length > 0 || sources.length > 0,
    [clinicalTrials.length, publications.length, sources.length]
  );

  const [activeTab, setActiveTab] = useState<EvidenceTabName>('Publications');
  const firstTabHeading: EvidenceTabName = useMemo(() => 
    getFirstTabHeading(publications.length, clinicalTrials.length, miscEvidence.length)
  , [publications.length, clinicalTrials.length, miscEvidence.length]);
  const firstTabHeadingRef = useRef(firstTabHeading);
  firstTabHeadingRef.current = firstTabHeading;
  const handleTabSelection = (tabName: string) => {
    setActiveTab(tabName as EvidenceTabName);
  };

  const dataCounts = useMemo(() => ({
    pubs: publications.length,
    cts: clinicalTrials.length,
    misc: miscEvidence.length,
    sources: sources.length,
  }), [publications.length, clinicalTrials.length, miscEvidence.length, sources.length]);
  const dataCountsRef = useRef(dataCounts);
  dataCountsRef.current = dataCounts;

  // reset active tab when component is closed
  useEffect(() => {
    if (!isOpen)
      setActiveTab(firstTabHeading);
  }, [isOpen, firstTabHeading]);

  // reset active tab when selected edge changes, preferring initialTab if available
  useEffect(() => {
    if (selectedEdge) {
      const target = initialTabRef.current && tabHasData(initialTabRef.current, dataCountsRef.current)
        ? initialTabRef.current
        : firstTabHeadingRef.current;
      setActiveTab(target);
    }
  }, [selectedEdge]);

  return (
    <Tabs
      isOpen={isOpen}
      className={styles.tabs}
      controlled={true}
      activeTab={activeTab}
      defaultActiveTab={firstTabHeading}
      handleTabSelection={handleTabSelection}
      fadeClassName={styles.fade}
    >
      {publications.length > 0 ? (
        <Tab heading="Publications" className={`${styles.tab} scrollable`}>
          <PublicationsTable
            selectedEdge={selectedEdge}
            publications={publications}
            setPublications={setPublications}
            pk={pk}
            prefs={prefs}
            isOpen={isOpen}
          />
        </Tab>
      ) : null}

      {clinicalTrials.length > 0 ? (
        <Tab heading="Clinical Trials" className={`${styles.tab} scrollable`}>
          <ClinicalTrialsTable clinicalTrials={clinicalTrials} />
        </Tab>
      ) : null}

      {miscEvidence.length > 0 ? (
        <Tab heading="Miscellaneous" className={`${styles.tab} scrollable`}>
          <MiscEvidenceTable miscEvidence={miscEvidence} />
        </Tab>
      ) : null}

      {sources.length > 0 ? (
        <Tab
          heading="Knowledge Sources"
          tooltipIcon={<InfoIcon className={styles.infoIcon} />}
          dataTooltipId="knowledge-sources-tooltip"
          className={`${styles.tab} scrollable`}
        >
          <KnowledgeSourcesTable sources={sources} />
        </Tab>
      ) : null}

      {!hasEvidence ? (
        <Tab heading="No Evidence Available">
          <p className={styles.noEvidence}>No evidence is currently available for this item.</p>
        </Tab>
      ) : null}
    </Tabs>
  );
}; 

export default EvidenceTabs;