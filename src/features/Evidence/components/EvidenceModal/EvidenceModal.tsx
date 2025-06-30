import {useState, useEffect, useRef, FC, useMemo} from "react";
import Modal from "@/features/Common/components/Modal/Modal";
import Tabs from "@/features/Common/components/Tabs/Tabs";
import Tab from "@/features/Common/components/Tabs/Tab";
import styles from './EvidenceModal.module.scss';
import ExternalLink from '@/assets/icons/Buttons/External Link.svg?react';
import { getCompressedSubgraph, getCompressedEdge, hasSupport } from "@/features/Common/utils/utilities";
import { isPublication, getFormattedEdgeLabel, getUrlByType } from "@/features/Evidence/utils/utilities";
import { isResultEdge, Path, Result, ResultEdge, ResultNode, ResultSet } from "@/features/ResultList/types/results.d";
import { Provenance, PublicationObject, TrialObject } from "@/features/Evidence/types/evidence.d";
import { getResultSetById } from "@/features/ResultList/slices/resultsSlice";
import { compareByKeyLexographic } from "@/features/Common/utils/sortingFunctions";
import { flattenPublicationObject, flattenTrialObject } from "@/features/Evidence/utils/evidenceModalFunctions";
import { cloneDeep } from "lodash";
import { useSelector } from 'react-redux';
import { currentPrefs } from "@/features/UserAuth/slices/userSlice";
import InfoIcon from "@/assets/icons/Status/Alerts/Info.svg?react";
import ChevDown from "@/assets/icons/Directional/Chevron/Chevron Down.svg?react";
import Tooltip from "@/features/Common/components/Tooltip/Tooltip";
import PublicationsTable from "@/features/Evidence/components/EvidenceTables/PublicationsTable";
import Button from "@/features/Common/components/Button/Button";
import PathView from "@/features/ResultItem/components/PathView/PathView";
import { useSeenStatus } from "@/features/ResultItem/hooks/resultHooks";

interface EvidenceModalProps {
  edge: ResultEdge | null;
  isOpen: boolean;
  onClose: Function;
  path?: Path | null;
  pathKey: string
  pk: string;
  result: Result | null;
}

const EvidenceModal: FC<EvidenceModalProps> = ({
  edge = null,
  isOpen,
  onClose,
  path = null,
  pathKey = "",
  pk,
  result }) => {

  const prefs = useSelector(currentPrefs);
  const resultSet = useSelector(getResultSetById(pk));

  const [pubmedEvidence, setPubmedEvidence] = useState<PublicationObject[]>([]);
  const [sources, setSources] = useState<Provenance[]>([]);
  const clinicalTrials = useRef<any[]>([]);
  const miscEvidence = useRef<any[]>([]);
  const hasBeenOpened = useRef(false);
  const [selectedEdge, setSelectedEdge] = useState(edge);
  const [selectedEdgeTrigger, setEdgeSelectedTrigger] = useState(false);
  const [edgeLabel, setEdgeLabel] = useState<string | null>(null);
  const [isPathViewMinimized, setIsPathViewMinimized] = useState(false);
  const isInferred = hasSupport(selectedEdge);

  const { isEdgeSeen, markEdgeSeen, markEdgeUnseen } = useSeenStatus(pk);
  const edgeSeen = !!selectedEdge?.id && isEdgeSeen(selectedEdge.id);

  const compressedSubgraph: (ResultNode | ResultEdge | ResultEdge[])[] | false = useMemo(()=>{
    return path?.compressedSubgraph && !!resultSet ? getCompressedSubgraph(resultSet, path.compressedSubgraph) : false;
  }, [path, resultSet]);

  const handleClose = () => {
    onClose();
    setSelectedEdge(null);
    setIsPathViewMinimized(false);
    hasBeenOpened.current = false;
  }

  // handles opening of modal by initializing state, called in useEffect tracking isOpen prop
  const handleModalOpen = (resultSet: ResultSet, selEdge: ResultEdge) => {
    handleSelectedEdge(resultSet, selEdge);
  }

  useEffect(() => {
    if(isOpen && !hasBeenOpened.current && !!edge && resultSet) {
      handleModalOpen(resultSet, edge);
      hasBeenOpened.current = true;
    }
  })

  // filters evidence based on provided selectedEdge
  const handleSelectedEdge = (resultSet: ResultSet, selEdge: ResultEdge) => {
    if (selEdge === null || selEdge === undefined)
      return;

    let filteredEvidence = {
      publications: new Set<PublicationObject>(),
      sources: new Set<Provenance>(),
      trials: new Set<TrialObject>()
    };
    filteredEvidence.publications = new Set(flattenPublicationObject(resultSet, selEdge.publications));
    filteredEvidence.trials = new Set(flattenTrialObject(resultSet, selEdge.trials));
    filteredEvidence.sources = new Set(selEdge.provenance);
    setSelectedEdge(selEdge);
    const formatted = getFormattedEdgeLabel(resultSet, selEdge).replaceAll("|", " ");
    setEdgeLabel(formatted);
    distributeEvidence(filteredEvidence);
    markEdgeSeen(selEdge.id);
  }

  const distributeEvidence = (evidence: {publications: Set<PublicationObject>, sources: Set<Provenance>, trials: Set<TrialObject> }) => {
    setPubmedEvidence(cloneDeep([...evidence.publications].filter(item => isPublication(item))));
    clinicalTrials.current = cloneDeep([...evidence.trials]);
    miscEvidence.current = cloneDeep([...evidence.publications].filter(item => !isPublication(item)))
      .filter((v,i,a) => a.findIndex(v2 => (v2.id === v.id)) === i);
    let displayedSources = [...evidence.sources];
    displayedSources.sort(compareByKeyLexographic('name'));
    setSources(displayedSources);
  }

  const handleEdgeClick = (edgeIDs: string[], path: Path) => {
    if(!resultSet)
      return;
    const getEdgeFromSubgraph = (edgeID: string, subgraph: (ResultEdge | ResultNode | ResultEdge[])[]) => {
      for(let i = 1; i < subgraph.length; i+=2) {
        const edgeItem = subgraph[i];
        if(Array.isArray(edgeItem)) {
          let edge = edgeItem.find(edge => edge.id === edgeID);
          if(!!edge)
            return edge;
        } else {
          if(edgeItem.id === edgeID)
            return subgraph[i];
        }
      }
      return false;
    }
    let edge;
    if(compressedSubgraph) 
      edge = getEdgeFromSubgraph(edgeIDs[0], compressedSubgraph)
    else
      edge = getCompressedEdge(resultSet, edgeIDs);
      
    if(!isResultEdge(edge) || !selectedEdge || !resultSet)
      return;

    handleSelectedEdge(resultSet, edge)
    setEdgeSelectedTrigger(prev=>!prev);
  }

  const handleToggleSeen = () => {
    if(selectedEdge === null) {
      console.warn("edge seen status cannot be toggled, selectedEdge is null."); 
      return;
    }
    if(edgeSeen)
      markEdgeUnseen(selectedEdge.id);
    else
      markEdgeSeen(selectedEdge.id);
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className={`${styles.evidenceModal} evidence-modal`} containerClass={`${styles.evidenceContainer}`}>
      {result?.drug_name &&
        <div className={styles.top}>
          <h5 className={styles.title}>{isInferred ? "Indirect" : "Direct"} Path {pathKey} Evidence</h5>
          <div className={styles.labelContainer}>
            {
              edgeLabel &&
              <p className={styles.subtitle}>{edgeLabel}</p>
            }
            <span className={styles.sep}>·</span>
            <p 
              className={styles.toggleSeen}
              onClick={handleToggleSeen}
              >
              Mark as {edgeSeen ? "Unseen" : "Seen"}
            </p>
          </div>
          <Tooltip id="knowledge-sources-tooltip" >
            <span>The resources that provided the information supporting the selected relationship.</span>
          </Tooltip>
          {
            path &&
            <div className={`${styles.pathViewContainer} ${isPathViewMinimized && styles.minimized}`}>
              {
                compressedSubgraph && 
                <Button isSecondary handleClick={()=>setIsPathViewMinimized(prev=>!prev)} className={styles.togglePathView}>
                  {
                    isPathViewMinimized
                    ? "Expand"
                    : "Collapse"
                  }
                  <ChevDown/>
                </Button>
              }
              <PathView
                pathArray={[path]}
                selectedPaths={new Set()}
                handleEdgeSpecificEvidence={handleEdgeClick}
                handleActivateEvidence={(path)=> console.log(path)}
                activeEntityFilters={[]}
                pathFilterState={{}}
                isEven={false}
                active={isOpen}
                activeFilters={[]}
                pk={pk ? pk : ""}
                setShowHiddenPaths={()=>{}}
                showHiddenPaths={true}
                resultID={result.id}
                inModal={true}
                compressedSubgraph={compressedSubgraph}
                selectedEdge={selectedEdge}
              />
            </div>
          }
          {
            isInferred
            ?
              <div className={styles.inferredDisclaimer}>
                <p>Supporting evidence for this relationship, including intermediary connections, can be found in the next path(s).</p>
                <p>Reasoning agents that use logic and pattern recognition to find connections between objects identified this path as a possible connection between this result and your search term.</p>
                <a href="/help#reasoner" target="_blank">Learn More about Reasoning Agents</a>
              </div>
            :
              <Tabs isOpen={isOpen} className={styles.tabs}>
                {
                  pubmedEvidence.length > 0 ?
                  <Tab heading="Publications" className={`${styles.tab} scrollable`}>
                    <PublicationsTable
                      selectedEdgeTrigger={selectedEdgeTrigger}
                      selectedEdge={selectedEdge}
                      pubmedEvidence={pubmedEvidence}
                      setPubmedEvidence={setPubmedEvidence}
                      pk={pk}
                      prefs={prefs}
                      isOpen={isOpen}
                    />
                  </Tab>
                  : null
                }
                {
                  clinicalTrials.current.length > 0 ?
                  <Tab heading="Clinical Trials" className={`${styles.tab} scrollable`}>
                    <div className={`table-body ${styles.tableBody} ${styles.clinicalTrials}`}>
                      <div className={`table-head ${styles.tableHead}`}>
                        <div className={`head ${styles.head} ${styles.link}`}>Link</div>
                      </div>
                      <div className={`table-items ${styles.tableItems} scrollable`}>
                        {
                          clinicalTrials.current.map((item, i)=> {
                            let url = item.url
                            if(!item.url && !!item.id) {
                              url = getUrlByType(item.id, item.type);
                            }
                            return (
                              <div className={styles.tableItem} key={i}>
                                <div className={`table-cell ${styles.cell} ${styles.link} link`}>
                                  {url && <a href={url} rel="noreferrer" target="_blank">{url} <ExternalLink/></a>}
                                </div>
                              </div>
                            )
                          })
                        }
                      </div>
                    </div>
                  </Tab>
                  : null
                }
                {
                  miscEvidence.current.length > 0 ?
                  <Tab heading="Miscellaneous" className={`${styles.tab} scrollable`}>
                    <div className={`table-body ${styles.tableBody} ${styles.misc}`}>
                      <div className={`table-head ${styles.tableHead}`}>
                        <div className={`head ${styles.head} ${styles.link}`}>Link</div>
                      </div>
                      <div className={`table-items ${styles.tableItems} scrollable`}>
                        {
                          miscEvidence.current.map((item, i) => {
                            return (
                              <div className={`table-item ${styles.tableItem}`} key={i}>
                                <div className={`table-cell ${styles.cell} ${styles.link} link`}>
                                  {item.url && <a href={item.url} rel="noreferrer" target="_blank">{item.url} <ExternalLink/></a>}
                                </div>
                              </div>
                            )
                          })
                        }
                      </div>
                    </div>
                  </Tab>
                  : null
                }
                {
                  // Add sources modal for predicates
                  sources.length > 0 ?
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
                        {
                          sources.map((src, i) => {
                            const sourceKey = `${src.url}-${i}`;
                            const tooltipId = `source-tooltip-${sourceKey}`;
                            return(
                              <div className={`table-item ${styles.tableItem}`} key={sourceKey}>
                                <Tooltip id={tooltipId}>
                                  <span className={styles.tooltipSpan}>
                                    <a href={src?.wiki} target="_blank" rel="noreferrer">
                                      Why do we use this source?
                                      <ExternalLink/>
                                    </a>
                                  </span>
                                </Tooltip>
                                <span className={`table-cell ${styles.cell} ${styles.source} ${styles.sourceItem}`}>
                                  {src.name}
                                  {
                                    src?.wiki
                                    ? <InfoIcon className={styles.infoIcon} data-tooltip-id={tooltipId} />
                                    : <></>
                                  }
                                </span>
                                <span className={`table-cell ${styles.cell} ${styles.link} ${styles.sourceItem}`}>
                                  {
                                    src?.url
                                    ?
                                      <a href={src?.url} target="_blank" rel="noreferrer" className={`url ${styles.edgeProvenanceLink}`}>
                                        {src?.url}
                                        <ExternalLink/>
                                      </a>
                                    :
                                      <span>No link available</span>
                                  }
                                </span>
                              </div>
                            )
                          })
                        }
                      </div>
                    </div>
                  </Tab>
                  : null
                }
                {
                  (clinicalTrials.current.length <= 0 &&
                  pubmedEvidence.length <= 0 &&
                  sources.length <= 0) ?
                  <Tab heading="No Evidence Available">
                    <p className={styles.noEvidence}>No evidence is currently available for this item.</p>
                  </Tab>
                  : null
                }
              </Tabs>
          }
        </div>
      }
    </Modal>
  );
}

export default EvidenceModal;
