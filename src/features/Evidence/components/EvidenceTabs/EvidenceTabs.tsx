import { Dispatch, FC, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import Tabs from '@/features/Core/components/Tabs/Tabs';
import Tab from '@/features/Core/components/Tabs/Tab';
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
import { trackEvent } from '@/features/Analytics/utils/dataLayer';

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

type EvidenceCounts = { pubs: number; cts: number; misc: number; sources: number };

const getTabCount = (tab: EvidenceTabName, counts: EvidenceCounts): number => {
  switch (tab) {
    case 'Publications': return counts.pubs;
    case 'Clinical Trials': return counts.cts;
    case 'Miscellaneous': return counts.misc;
    case 'Knowledge Sources': return counts.sources;
    default: return 0;
  }
};

const tabHasData = (tab: EvidenceTabName, counts: EvidenceCounts): boolean =>
  getTabCount(tab, counts) > 0;

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

  // Tracked on onTabClick rather than handleTabSelection: Tabs also calls the
  // latter when it resets an invalid active tab, which is not a user choice.
  const handleTabClick = (tabName: string) => {
    trackEvent('evidence_tab_changed', {
      tab_name: tabName,
      item_count: getTabCount(tabName as EvidenceTabName, dataCounts),
    });
  };

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
      onTabClick={handleTabClick}
      fadeClassName={styles.fade}
    >
      {publications.length > 0 ? (
        <Tab heading="Publications" className={styles.tab}>
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
        <Tab heading="Clinical Trials" className={styles.tab}>
          <ClinicalTrialsTable clinicalTrials={clinicalTrials} prefs={prefs} />
        </Tab>
      ) : null}

      {miscEvidence.length > 0 ? (
        <Tab heading="Miscellaneous" className={styles.tab}>
          <MiscEvidenceTable miscEvidence={miscEvidence} prefs={prefs} />
        </Tab>
      ) : null}

      {sources.length > 0 ? (
        <Tab
          heading="Knowledge Sources"
          tooltipIcon={<InfoIcon className={styles.infoIcon} />}
          dataTooltipId="knowledge-sources-tooltip"
          className={styles.tab}
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