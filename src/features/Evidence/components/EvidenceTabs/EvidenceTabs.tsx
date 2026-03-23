import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react';
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
}

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
}) => {
  const hasEvidence = useMemo(() => 
    clinicalTrials.length > 0 || publications.length > 0 || sources.length > 0,
    [clinicalTrials.length, publications.length, sources.length]
  );

  const [activeTab, setActiveTab] = useState<'Publications' | 'Clinical Trials' | 'Miscellaneous' | 'Knowledge Sources'>('Publications');
  const firstTabHeading = publications.length > 0 ? 'Publications' : clinicalTrials.length > 0 ? 'Clinical Trials' : sources.length > 0 ? 'Knowledge Sources' : 'Miscellaneous';
  const handleTabSelection = (tabName: string) => {
    setActiveTab(tabName as 'Publications' | 'Clinical Trials' | 'Miscellaneous' | 'Knowledge Sources');
  };

  // reset active tab when component is closed
  useEffect(() => {
    if (!isOpen)
      setActiveTab(firstTabHeading);
  }, [isOpen, firstTabHeading]);

  // reset active tab when selected edge changes
  useEffect(() => {
    if(selectedEdge)
      setActiveTab(firstTabHeading);
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