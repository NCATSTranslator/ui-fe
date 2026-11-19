import { Dispatch, FC, SetStateAction, useEffect, useRef, useState } from 'react';
import Tabs from '@/features/Core/components/Tabs/Tabs';
import Tab from '@/features/Core/components/Tabs/Tab';
import PublicationsTable from '@/features/Evidence/components/PublicationsTable/PublicationsTable';
import ClinicalTrialsTable from '@/features/Evidence/components/ClinicalTrialsTable/ClinicalTrialsTable';
import MiscEvidenceTable from '@/features/Evidence/components/MiscEvidenceTable/MiscEvidenceTable';
import KnowledgeSourcesTable from '@/features/Evidence/components/KnowledgeSourcesTable/KnowledgeSourcesTable';
import InfoIcon from '@/assets/icons/status/Alerts/Info.svg?react';
import { PublicationObject, TableState } from '@/features/Evidence/types/evidence.d';
import { ResultEdge } from '@/features/ResultList/types/results.d';
import { Preferences } from '@/features/UserAuth/types/user';
import { EvidenceTabName } from '@/features/Evidence/types/navigation';
import styles from '@/features/Evidence/components/EvidenceView/EvidenceView.module.scss';
import { trackEvent } from '@/features/Analytics/utils/dataLayer';
import { EdgeEvidence, hasEdgeEvidence } from '@/features/Evidence/utils/utilities';
import { ActiveTabName, NO_EVIDENCE_TAB, getEvidenceCounts, getFirstTabHeading, getTabCount, getTabHeading, tabHasData } from '@/features/Evidence/utils/evidenceTabs';

interface EvidenceTabsProps {
  isOpen: boolean;
  /** Evidence as displayed: misc links deduplicated, sources grouped by name. */
  evidence: EdgeEvidence;
  setPublications: Dispatch<SetStateAction<PublicationObject[]>>;
  pubTableState: TableState;
  updatePubTableState: (updates: Partial<TableState>) => void;
  selectedEdge: ResultEdge | null;
  pk: string;
  prefs: Preferences;
  initialTab?: EvidenceTabName;
}

const EvidenceTabs: FC<EvidenceTabsProps> = ({
  isOpen,
  evidence,
  setPublications,
  pubTableState,
  updatePubTableState,
  selectedEdge,
  pk,
  prefs,
  initialTab,
}) => {

  const initialTabRef = useRef(initialTab);
  initialTabRef.current = initialTab;

  const { publications, clinicalTrials, miscEvidence, sources } = evidence;

  const dataCounts = getEvidenceCounts(evidence);
  const dataCountsRef = useRef(dataCounts);
  dataCountsRef.current = dataCounts;

  const hasEvidence = hasEdgeEvidence(evidence);

  const firstTabHeading = getFirstTabHeading(dataCounts);
  const [activeTab, setActiveTab] = useState<ActiveTabName>(firstTabHeading);
  const firstTabHeadingRef = useRef(firstTabHeading);
  firstTabHeadingRef.current = firstTabHeading;
  const handleTabSelection = (tabName: string) => {
    setActiveTab(tabName as ActiveTabName);
  };

  // Tracked on onTabClick rather than handleTabSelection: Tabs also calls the
  // latter when it resets an invalid active tab, which is not a user choice.
  const handleTabClick = (tabName: string) => {
    trackEvent('evidence_tab_changed', {
      tab_name: tabName,
      item_count: getTabCount(tabName as ActiveTabName, dataCounts),
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
        <Tab heading="Publications" headingOverride={getTabHeading('Publications', dataCounts)} className={styles.tab}>
          <PublicationsTable
            selectedEdge={selectedEdge}
            publications={publications}
            setPublications={setPublications}
            tableState={pubTableState}
            updateTableState={updatePubTableState}
            pk={pk}
            prefs={prefs}
            isOpen={isOpen}
          />
        </Tab>
      ) : null}

      {clinicalTrials.length > 0 ? (
        <Tab heading="Clinical Trials" headingOverride={getTabHeading('Clinical Trials', dataCounts)} className={styles.tab}>
          <ClinicalTrialsTable clinicalTrials={clinicalTrials} prefs={prefs} />
        </Tab>
      ) : null}

      {miscEvidence.length > 0 ? (
        <Tab heading="Miscellaneous" headingOverride={getTabHeading('Miscellaneous', dataCounts)} className={styles.tab}>
          <MiscEvidenceTable miscEvidence={miscEvidence} prefs={prefs} />
        </Tab>
      ) : null}

      {sources.length > 0 ? (
        <Tab
          heading="Knowledge Sources"
          headingOverride={getTabHeading('Knowledge Sources', dataCounts)}
          tooltipIcon={<InfoIcon className={styles.infoIcon} />}
          dataTooltipId="knowledge-sources-tooltip"
          className={styles.tab}
        >
          <KnowledgeSourcesTable sources={sources} />
        </Tab>
      ) : null}

      {!hasEvidence ? (
        <Tab heading={NO_EVIDENCE_TAB}>
          <p className={styles.noEvidence}>No evidence is currently available for this item.</p>
        </Tab>
      ) : null}
    </Tabs>
  );
}; 

export default EvidenceTabs;