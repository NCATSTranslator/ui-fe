import {useState, useEffect, useRef} from "react";
import Modal from "./Modal";
import Tabs from "../Tabs/Tabs";
import Tab from "../Tabs/Tab";
import PathObject from "../PathObject/PathObject";
import styles from './EvidenceModal.module.scss';
import ExternalLink from '../../Icons/Buttons/External Link.svg?react';
import { capitalizeAllWords, formatBiolinkEntity, isClinicalTrial, isPublication, isPublicationDictionary, numberToWords } from "../../Utilities/utilities";
import { compareByKeyLexographic } from '../../Utilities/sortingFunctions';
import { getFormattedEdgeLabel, getUrlByType } from '../../Utilities/resultsFormattingFunctions';
import { checkForEdgeMatch, handleEvidenceSort } from "../../Utilities/evidenceModalFunctions";
import { cloneDeep } from "lodash";
import { useSelector } from 'react-redux';
import { currentPrefs } from '../../Redux/rootSlice';
import Information from '../../Icons/Status/Alerts/Info.svg?react';
import Tooltip from "../Tooltip/Tooltip";
import PublicationsTable from "../EvidenceTables/PublicationsTable";

const EvidenceModal = ({path = null, isOpen, onClose, item, edgeGroup = null}) => {

  const prefs = useSelector(currentPrefs);
  const [pubmedEvidence, setPubmedEvidence] = useState([]);
  const [sources, setSources] = useState([]);
  const clinicalTrials = useRef([]);
  const miscEvidence = useRef([]);
  const hasBeenOpened = useRef(false);
  const [selectedItem, setSelectedItem] = useState({});
  const [selectedEdge, setSelectedEdge] = useState(edgeGroup);
  const [selectedEdgeTrigger, setEdgeSelectedTrigger] = useState(false);
  const [formattedEdge, setFormattedEdge] = useState(null);

  const pathLength = (path) ? path.path.subgraph.length : 0;

  useEffect(() => {
    setSelectedItem(item);
  }, [item])

  const handleClose = () => {
    onClose();
    setSelectedEdge(null);
    hasBeenOpened.current = false;
  }

  // handles opening of modal by initializing state, called in useEffect tracking isOpen prop
  const handleModalOpen = (selEdge) => {
      handleSelectedEdge(selEdge);
  }

  useEffect(() => {
    if(isOpen && !hasBeenOpened.current) {
      handleModalOpen(edgeGroup);
      hasBeenOpened.current = true;
    }
  })

  // filters evidence based on provided selectedEdge
  const handleSelectedEdge = (selEdge) => {
    if (selEdge === null || selEdge === undefined)
      return;

    let filteredEvidence = {
      publications: new Set(),
      sources: new Set()
    };
    filteredEvidence.publications = selEdge.publications;
    filteredEvidence.sources = selEdge.provenance;
    setSelectedEdge(selEdge);
    let soloEdge = selEdge.edges.find(edge => formatBiolinkEntity(edge.predicate.predicate) === selEdge.predicate);
    // handle old edge format for old user saves
    if(soloEdge === undefined)
      soloEdge = selEdge.edges.find(edge => formatBiolinkEntity(edge.predicate) === selEdge.predicate);
    const formatted = getFormattedEdgeLabel(soloEdge.subject.name, soloEdge.predicate.predicate, soloEdge.object.name).replaceAll("|", " ");
    setFormattedEdge(formatted);
    distributeEvidence(filteredEvidence);
  }
  
  const loopIDsIntoNewPubs = (publications, knowledgeLevel = "unknown", objArray) => {
    for(const pubID of publications) {
      let type = (pubID.includes("PMID")) 
      ? "PMID"
      : (pubID.includes("PMC"))
        ? "PMC"
        : (pubID.includes("clinicaltrials"))
          ? "NCT"
          : null;
      let newPub = {
        id: pubID,
        type: type,
        knowledgeLevel: knowledgeLevel
      }
      objArray.push(newPub);
    }
  }

  const distributeEvidence = (evidence) => {
    if(!Array.isArray(evidence)) {
      // if evidence is using the old format, handle it differently
      if(isPublicationDictionary(evidence.publications)) {
        let pubs = [];
        for(const knowledgeLevel of Object.keys(evidence.publications)) {
          loopIDsIntoNewPubs(evidence.publications[knowledgeLevel], knowledgeLevel, pubs);
        }
        setPubmedEvidence(cloneDeep([...pubs].filter(item => isPublication(item))));
        clinicalTrials.current = cloneDeep([...pubs].filter(item => isClinicalTrial(item)));
        miscEvidence.current = cloneDeep([...pubs].filter(item => !isPublication(item) && !isClinicalTrial(item)))
        .filter((v,i,a) => a.findIndex(v2 => (v2.id === v.id)) === i);
      // support even older format
      } else if(Array.isArray(evidence.publications) && evidence.publications.length > 0 && typeof evidence.publications[0] == "string") {
        let pubs = [];
        loopIDsIntoNewPubs(evidence.publications, "unknown", pubs);
        setPubmedEvidence(cloneDeep([...pubs].filter(item => isPublication(item))));
        clinicalTrials.current = cloneDeep([...pubs].filter(item => isClinicalTrial(item)));
        miscEvidence.current = cloneDeep([...pubs].filter(item => !isPublication(item) && !isClinicalTrial(item)))
        .filter((v,i,a) => a.findIndex(v2 => (v2.id === v.id)) === i);
      } else {
        setPubmedEvidence(cloneDeep([...evidence.publications].filter(item => isPublication(item))));
        clinicalTrials.current = cloneDeep([...evidence.publications].filter(item => isClinicalTrial(item)));
        miscEvidence.current = cloneDeep([...evidence.publications].filter(item => !isPublication(item) && !isClinicalTrial(item)))
          .filter((v,i,a) => a.findIndex(v2 => (v2.id === v.id)) === i);
      }
      let displayedSources = [...evidence.sources]; 
      displayedSources.sort(compareByKeyLexographic('name'));
      setSources(displayedSources);
    }
  }

  const handleEdgeClick = (edge) => {
    if(!edge || checkForEdgeMatch(edge, selectedEdge) === true) 
      return;
    handleSelectedEdge(edge)
    setEdgeSelectedTrigger(prev=>!prev);
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className={`${styles.evidenceModal} evidence-modal`} containerClass={`${styles.evidenceContainer}`}>
      {selectedItem.name &&       
        <div className={styles.top}>
          <h5 className={styles.title}>Showing Evidence for:</h5> 
          {
            formattedEdge &&
            <h5 className={styles.subtitle}>{capitalizeAllWords(formattedEdge)}</h5>
          }
          <Tooltip id="knowledge-sources-tooltip" >
            <span>The resources that provided the information supporting the selected relationship.</span>
          </Tooltip>
          {
            path &&
            <div className={styles.pathViewContainer}>
              <div className={`${styles.pathView} scrollable-support path ${numberToWords(pathLength)}`}>
                {
                  path.path.subgraph.map((pathItem, i) => {
                    let key = `${i}`;
                    let isSelected = false;
                    let pathItemHasSupport = pathItem.inferred;
                    if(pathItem.category === "predicate" && pathItem.predicates.length > 1) {
                      let newPathItem = cloneDeep(pathItem);
                      newPathItem.predicates = [newPathItem.predicates[0]];
                      newPathItem.predicate = newPathItem.predicates[0].predicate;
                      isSelected = (pathItem.category === "predicate" && checkForEdgeMatch(selectedEdge, newPathItem));
                      return( 
                        <div className={`groupedPreds ${styles.groupedPreds} ${(pathItem.predicates.length === 2) ? styles.hasTwo :''}`}>
                          <PathObject 
                            pathObject={newPathItem} 
                            id={pathItem.id}
                            key={pathItem.id}
                            handleNameClick={()=>{console.log("evidence modal path object clicked!")}}
                            handleEdgeClick={(edge)=>handleEdgeClick(edge)}
                            handleTargetClick={()=>{console.log("evidence modal path target clicked!")}}
                            activeStringFilters={[]}
                            selected={isSelected}
                            inModal
                            hasSupport={pathItemHasSupport}
                            className={styles.pathContainer}
                          />
                          {
                            pathItem.compressedEdges.map((edge, j) => {
                              isSelected = (pathItem.category === "predicate" && checkForEdgeMatch(selectedEdge, edge));
                              key = `${edge.id}`;
                              return (
                                <PathObject 
                                  pathObject={edge} 
                                  id={key}
                                  key={key}
                                  handleNameClick={()=>{console.log("evidence modal path object clicked!")}}
                                  handleEdgeClick={(edge)=>handleEdgeClick(edge)}
                                  handleTargetClick={()=>{console.log("evidence modal path target clicked!")}}
                                  activeStringFilters={[]}
                                  selected={isSelected}
                                  inModal
                                  hasSupport={pathItemHasSupport}
                                  className={styles.pathContainer}
                                />
                              ) 
                            })
                          }
                        </div>
                      )
                    } else {
                      isSelected = (pathItem.category === "predicate" && checkForEdgeMatch(selectedEdge, pathItem));
                      return (
                        <PathObject 
                          pathObject={pathItem} 
                          id={key}
                          key={key}
                          handleNameClick={()=>{console.log("evidence modal path object clicked!")}}
                          handleEdgeClick={(edge)=>handleEdgeClick(edge)}
                          handleTargetClick={()=>{console.log("evidence modal path target clicked!")}}
                          activeStringFilters={[]}
                          selected={isSelected}
                          inModal
                          hasSupport={pathItemHasSupport}
                        />
                      ) 
                    }
                  }) 
                }
              </div>
            </div>
          }
          <Tabs isOpen={isOpen} className={styles.tabs}>
            {
              pubmedEvidence.length > 0 &&
              <Tab heading="Publications" className={styles.tab}>
                <PublicationsTable
                  selectedEdgeTrigger={selectedEdgeTrigger}
                  selectedEdge={selectedEdge}
                  pubmedEvidence={pubmedEvidence} 
                  setPubmedEvidence={setPubmedEvidence}
                  handleEvidenceSort={handleEvidenceSort}
                  item={item}
                  prefs={prefs}
                  isOpen={isOpen}
                />
              </Tab>
            }
            {
              clinicalTrials.current.length > 0 &&
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
            }
            {
              miscEvidence.current.length > 0 &&
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
            }
            {
              // Add sources modal for predicates
              sources.length > 0 &&
              <Tab 
                heading="Knowledge Sources" 
                tooltipIcon={<Information className={styles.infoIcon} />}
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
                        const name = (!Array.isArray(src) && typeof src === 'object') ? src.name: '';
                        const url = (!Array.isArray(src) && typeof src === 'object') ? src.url: src;
                        return(
                          <div className={`table-item ${styles.tableItem}`}>
                            <span className={`table-cell ${styles.cell} ${styles.source} ${styles.sourceItem}`}>
                              <span className={styles.sourceEdge} key={i}>{name}</span>
                            </span>
                            <span className={`table-cell ${styles.cell} ${styles.link} ${styles.sourceItem}`}>
                              {
                                url 
                                ? 
                                  <a key={i} href={url} target="_blank" rel="noreferrer" className={`url ${styles.edgeProvenanceLink}`}>
                                    {url}
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
            }
            {
              clinicalTrials.current.length <= 0 &&
              pubmedEvidence.length <= 0 &&
              sources.length <= 0 &&
              <Tab heading="No Evidence Available">
                <p className={styles.noEvidence}>No evidence is currently available for this item.</p>
              </Tab>
            }
          </Tabs>
        </div>
      }
    </Modal>
  );
}


export default EvidenceModal;