import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react';
import Tabs from '@/features/Common/components/Tabs/Tabs';
import Tab from '@/features/Common/components/Tabs/Tab';
import PublicationsTable from '@/features/Evidence/components/PublicationsTable/PublicationsTable';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import InfoIcon from '@/assets/icons/status/Alerts/Info.svg?react';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import { getUrlByType } from '@/features/Evidence/utils/utilities';
import { PublicationObject, Provenance, TrialObject } from '@/features/Evidence/types/evidence.d';
import { ResultEdge } from '@/features/ResultList/types/results.d';
import { Preferences } from '@/features/UserAuth/types/user';
import styles from '@/features/Evidence/components/EvidenceModal/EvidenceModal.module.scss';
import { getFormattedDate } from '@/features/Common/utils/utilities';

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
          <div className={`table-body ${styles.tableBody} ${styles.clinicalTrials}`}>
            <div className={`table-head ${styles.tableHead}`}>
              <div className={`head ${styles.head}`}>Title</div>
              <div className={`head ${styles.head}`}>Start Date</div>
              <div className={`head ${styles.head}`}>Phase</div>
              <div className={`head ${styles.head}`}>Status</div>
              <div className={`head ${styles.head}`}>Participants</div>
            </div>
            <div className={`table-items ${styles.tableItems} scrollable`}>
              {clinicalTrials.map((item, i) => {
                let url = item.url;
                let title = item.title;
                let startDate = item.start_date;
                let phase = item.phase;
                let participants = item.size;
                let type = item.type;
                let status = item.status;
                if (!item.url && item.id) {
                  url = getUrlByType(item.id, "NCT");
                }
                return (
                  <div className={styles.tableItem} key={i}>
                    <div className={`table-cell ${styles.cell} ${styles.link} link`}>
                      {url && (
                        <a href={url} rel="noreferrer" target="_blank">
                          {title || url} <ExternalLink />
                        </a>
                      )}
                    </div>
                    <div className={`table-cell ${styles.cell}`}>
                      {startDate ? getFormattedDate(new Date(startDate), false) : ''}
                    </div>
                    <div className={`table-cell ${styles.cell}`}>
                      {phase}
                    </div>
                    <div className={`table-cell ${styles.cell}`}>
                      {status}
                    </div>
                    <div className={`table-cell ${styles.cell}`}>
                      {participants} {type || ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Tab>
      ) : null}

      {miscEvidence.length > 0 ? (
        <Tab heading="Miscellaneous" className={`${styles.tab} scrollable`}>
          <div className={`table-body ${styles.tableBody} ${styles.misc}`}>
            <div className={`table-head ${styles.tableHead}`}>
              <div className={`head ${styles.head} ${styles.link}`}>Link</div>
            </div>
            <div className={`table-items ${styles.tableItems} scrollable`}>
              {miscEvidence.map((item, i) => (
                <div className={`table-item ${styles.tableItem}`} key={i}>
                  <div className={`table-cell ${styles.cell} ${styles.link} link`}>
                    {item.url && (
                      <a href={item.url} rel="noreferrer" target="_blank">
                        {item.url} <ExternalLink />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Tab>
      ) : null}

      {sources.length > 0 ? (
        <Tab
          heading="Knowledge Sources"
          tooltipIcon={<InfoIcon className={styles.infoIcon} />}
          dataTooltipId="knowledge-sources-tooltip"
          className={`${styles.tab} scrollable`}
        >
          <div className={`table-body ${styles.tableBody} ${styles.sources}`}>
            <div className={`table-head ${styles.tableHead}`}>
              <div className={`head ${styles.head}`}>Source</div>
              <div className={`head ${styles.head}`}>Rationale</div>
            </div>
            <div className={`table-items ${styles.tableItems} scrollable`}>
              {sources.map((src, i) => {
                const sourceKey = `${src.url}-${i}`;
                const tooltipId = `source-tooltip-${sourceKey}`;
                return (
                  <div className={`table-item ${styles.tableItem}`} key={sourceKey}>
                    <Tooltip id={tooltipId}>
                      <span className={styles.tooltipSpan}>
                        <a href={src?.wiki} target="_blank" rel="noreferrer">
                          Why do we use this source?
                          <ExternalLink />
                        </a>
                      </span>
                    </Tooltip>
                    <span className={`table-cell ${styles.cell} ${styles.source} ${styles.sourceItem}`}>
                      {src.name}
                      {src?.wiki && <InfoIcon className={styles.infoIcon} data-tooltip-id={tooltipId} />}
                    </span>
                    <span className={`table-cell ${styles.cell} ${styles.link} ${styles.sourceItem}`}>
                      {src?.url ? (
                        <a href={src.url} target="_blank" rel="noreferrer" className={`url ${styles.edgeProvenanceLink}`}>
                          {src.url}
                          <ExternalLink />
                        </a>
                      ) : (
                        <span>No link available</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
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