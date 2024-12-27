import {useState, useEffect, useRef, FC} from "react";
import Modal from "./Modal";
import Tabs from "../Tabs/Tabs";
import Tab from "../Tabs/Tab";
import PathObject from "../PathObject/PathObject";
import styles from './EvidenceModal.module.scss';
import ExternalLink from '../../Icons/Buttons/External Link.svg?react';
import { capitalizeAllWords, isClinicalTrial, isPublication, numberToWords, getFormattedEdgeLabel, 
  getUrlByType,  } from "../../Utilities/utilities";
import { compareByKeyLexographic } from '../../Utilities/sortingFunctions';
import { checkForEdgeMatch, flattenPublicationsObject } from "../../Utilities/evidenceModalFunctions";
import { cloneDeep } from "lodash";
import { useSelector } from 'react-redux';
import { currentPrefs } from '../../Redux/rootSlice';
import InfoIcon from '../../Icons/Status/Alerts/Info.svg?react';
import PlusIcon from '../../Icons/Buttons/Add/Add.svg?react';
import MinusIcon from '../../Icons/Buttons/Subtract/Subtract.svg?react';
import Tooltip from "../Tooltip/Tooltip";
import PublicationsTable from "../EvidenceTables/PublicationsTable";
import Button from "../Core/Button";
import { isResultEdge, Path, Result, ResultEdge, ResultSet } from "../../Types/results.d";
import { Provenance, PublicationObject } from "../../Types/evidence.d";
import { getResultSetById, getEdgeById, getNodeById } from "../../Redux/resultsSlice";

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: Function;
  path?: Path | null;
  result?: Result;
  edge: ResultEdge | null;
  pk: string;
}

const EvidenceModal: FC<EvidenceModalProps> = ({
  path = null, 
  isOpen, 
  onClose, 
  result, 
  pk,
  edge = null}) => {

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

  const pathLength = (path) ? path.subgraph.length : 0;

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
      sources: new Set<Provenance>()
    };
    filteredEvidence.publications = new Set(flattenPublicationsObject(resultSet, selEdge.publications));
    filteredEvidence.sources = new Set(selEdge.provenance);
    setSelectedEdge(selEdge);
    const formatted = getFormattedEdgeLabel(resultSet, selEdge).replaceAll("|", " ");
    setEdgeLabel(formatted);
    distributeEvidence(filteredEvidence);
  }

  const distributeEvidence = (evidence: {publications: Set<PublicationObject>, sources: Set<Provenance> }) => {
    setPubmedEvidence(cloneDeep([...evidence.publications].filter(item => isPublication(item))));
    clinicalTrials.current = cloneDeep([...evidence.publications].filter(item => isClinicalTrial(item)));
    miscEvidence.current = cloneDeep([...evidence.publications].filter(item => !isPublication(item) && !isClinicalTrial(item)))
      .filter((v,i,a) => a.findIndex(v2 => (v2.id === v.id)) === i);
    let displayedSources = [...evidence.sources];
    displayedSources.sort(compareByKeyLexographic('name'));
    setSources(displayedSources);
  }

  const handleEdgeClick = (edgeID: string, path: Path) => {
    const edge = getEdgeById(resultSet, edgeID);
    if(!edge || !selectedEdge || !resultSet)
      return;
    handleSelectedEdge(resultSet, edge)
    setEdgeSelectedTrigger(prev=>!prev);
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className={`${styles.evidenceModal} evidence-modal`} containerClass={`${styles.evidenceContainer}`}>
      {result?.drug_name &&
        <div className={styles.top}>
          <h5 className={styles.title}>Evidence for:</h5>
          {
            edgeLabel &&
            <h5 className={styles.subtitle}>{capitalizeAllWords(edgeLabel)}</h5>
          }
          <Tooltip id="knowledge-sources-tooltip" >
            <span>The resources that provided the information supporting the selected relationship.</span>
          </Tooltip>
          {
            path &&
            <div className={`${styles.pathViewContainer} ${isPathViewMinimized && styles.minimized}`}>
              <Button iconOnly isSecondary handleClick={()=>setIsPathViewMinimized(prev=>!prev)} className={styles.togglePathView}>
                {
                  isPathViewMinimized 
                  ? <PlusIcon />
                  : <MinusIcon />
                }
              </Button>
              <div className={`${styles.pathView} scrollable-support path ${numberToWords(pathLength)}`}>
                {
                  !!path?.compressedSubgraph
                  ?
                    path.compressedSubgraph.map((itemID, i) => {
                      if(!Array.isArray(itemID)) {
                        const pathItem = (i % 2 === 0) ? getNodeById(resultSet, itemID) : getEdgeById(resultSet, itemID);
                        if(!pathItem)
                          return null;
  
                        let key = `${itemID}-${i}`;
                        const isEdge = isResultEdge(pathItem);
                        let isSelected = (isEdge && checkForEdgeMatch(selectedEdge, pathItem));
                        return (
                          <PathObject
                            pathViewStyles={styles}
                            index={i}
                            isEven={false}
                            path={path}
                            id={itemID}
                            key={key}
                            handleNodeClick={()=>{console.log("evidence modal node clicked!")}}
                            handleEdgeClick={handleEdgeClick}
                            pathFilterState={{}}
                            activeFilters={[]}
                            activeEntityFilters={[]}
                            selected={isSelected}
                            selectedPaths={null}
                            inModal={true}
                            pk={pk}
                          />
                        )
                      } else {
                        console.log(itemID);
                        return(
                          <div className="grouped-preds">
                            {
                              itemID.map((id, j)=> {
                                let key = `${edge}-${j}`;
                                const pathItem = getEdgeById(resultSet, id);
                                // console.log(id, pathItem);
                                if(!pathItem)
                                  return null;
          
                                const isEdge = isResultEdge(pathItem);
                                let isSelected = (isEdge && checkForEdgeMatch(selectedEdge, pathItem));
                                return (
                                  <PathObject
                                    pathViewStyles={styles}
                                    index={i}
                                    isEven={false}
                                    path={path}
                                    id={id}
                                    key={key}
                                    handleNodeClick={()=>{console.log("evidence modal node clicked!")}}
                                    handleEdgeClick={handleEdgeClick}
                                    pathFilterState={{}}
                                    activeFilters={[]}
                                    activeEntityFilters={[]}
                                    selected={isSelected}
                                    selectedPaths={null}
                                    inModal={true}
                                    pk={pk}
                                  />
                                )
                              })
                            }
                          </div>
                        )
                      }
                    })
                  :
                    path.subgraph.map((itemID, i) => {
                      const pathItem = (i % 2 === 0) ? getNodeById(resultSet, itemID) : getEdgeById(resultSet, itemID);
                      if(!pathItem)
                        return null;

                      let key = `${itemID}-${i}`;
                      const isEdge = isResultEdge(pathItem);
                      let isSelected = (isEdge && checkForEdgeMatch(selectedEdge, pathItem));
                      return (
                        <PathObject
                          pathViewStyles={styles}
                          index={i}
                          isEven={false}
                          path={path}
                          id={itemID}
                          key={key}
                          handleNodeClick={()=>{console.log("evidence modal node clicked!")}}
                          handleEdgeClick={handleEdgeClick}
                          pathFilterState={{}}
                          activeFilters={[]}
                          activeEntityFilters={[]}
                          selected={isSelected}
                          selectedPaths={null}
                          inModal={true}
                          pk={pk}
                        />
                      )
                    })
                }
              </div>
            </div>
          }
          <Tabs isOpen={isOpen} className={styles.tabs}>
            {
              pubmedEvidence.length > 0 ?
              <Tab heading="Publications" className={styles.tab}>
                <PublicationsTable
                  selectedEdgeTrigger={selectedEdgeTrigger}
                  selectedEdge={selectedEdge}
                  pubmedEvidence={pubmedEvidence}
                  setPubmedEvidence={setPubmedEvidence}
                  prefs={prefs}
                  isOpen={isOpen}
                />
              </Tab>
              : null
            }
            {
              clinicalTrials.current.length > 0 ?
              <Tab heading="Clinical Trials" className={styles.tab}>
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
              <Tab heading="Miscellaneous" className={styles.tab}>
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
                className={styles.tab}
                >
                <div className={`table-body ${styles.tableBody} ${styles.sources}`}>
                  <div className={`table-head ${styles.tableHead}`}>
                    <div className={`head ${styles.head}`}>Source</div>
                    <div className={`head ${styles.head}`}>Link</div>
                  </div>
                  <div className={`table-items ${styles.tableItems} scrollable`}>
                    {
                      sources.map((src, i) => {
                        return(
                          <div className={`table-item ${styles.tableItem}`} key={`${src.url}-${i}`}>
                            <span className={`table-cell ${styles.cell} ${styles.source} ${styles.sourceItem}`}>
                              <span className={styles.sourceEdge} key={i}>{src.name}</span>
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
                                  <span>Link Unavailable</span>
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
        </div>
      }
    </Modal>
  );
}

export default EvidenceModal;