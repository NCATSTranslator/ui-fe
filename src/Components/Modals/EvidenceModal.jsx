import {useState, useEffect, useRef} from "react";
import Modal from "./Modal";
import Tabs from "../Tabs/Tabs";
import PathObject from "../PathObject/PathObject";
import styles from './EvidenceModal.module.scss';
import ExternalLink from '../../Icons/external-link.svg?react';
import { capitalizeAllWords, formatBiolinkEntity } from "../../Utilities/utilities";
import { compareByKeyLexographic } from '../../Utilities/sortingFunctions';
import { getFormattedEdgeLabel } from '../../Utilities/resultsFormattingFunctions';
import { checkForEdgeMatch, handleEvidenceSort, filterEvidenceObjs } from "../../Utilities/evidenceModalFunctions";
import { cloneDeep } from "lodash";
import { useSelector } from 'react-redux';
import { currentPrefs } from '../../Redux/rootSlice';
import Information from '../../Icons/information.svg?react';
import Tooltip from "../Tooltip/Tooltip";
import PublicationsTable from "../EvidenceTables/PublicationsTable";

const EvidenceModal = ({path = null, isOpen, onClose, rawEvidence, item, isAll, edgeGroup = null}) => {

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

  useEffect(() => {
    setSelectedItem(item);
  }, [item])

  const handleClose = () => {
    onClose();
    setSelectedEdge(null);
    hasBeenOpened.current = false;
  }

  // handles opening of modal by initializing state, called in useEffect tracking isOpen prop
  const handleModalOpen = (rawEvi, selEdge, selPath) => {
    if(selEdge)
      handleSelectedEdge(selEdge, rawEvi);
    else 
      handleSelectedEdge(selPath.path.subgraph[1], rawEvi);
  }

  useEffect(() => {
    if(isOpen && !hasBeenOpened.current) {
      handleModalOpen(rawEvidence, edgeGroup, path);
      hasBeenOpened.current = true;
    }
  })

  // filters evidence based on provided selectedEdge (if any, otherwise returns full evidence), 
  // called in useEffect tracking selectedEdge (to accommodate both in-component edge selection and edgeGroup prop change)
  const handleSelectedEdge = (selEdge, rawEvidence) => {
    let evidenceToDistribute;
    if(!Array.isArray(selEdge) && typeof selEdge === 'object' && selEdge !== null) {
      let filteredEvidence = {
        publications: new Set(),
        sources: new Set()
      };
      let filteredPublications = filteredEvidence.publications;
      let filteredSources = filteredEvidence.sources;

      const edgeToFilterBy = selEdge.edges.find((edge)=> formatBiolinkEntity(edge.predicate) === selEdge.predicate);
      filterEvidenceObjs(rawEvidence.publications, edgeToFilterBy, filteredPublications);
      filterEvidenceObjs(rawEvidence.sources, edgeToFilterBy, filteredSources);
      
      evidenceToDistribute = filteredEvidence;
      setSelectedEdge(selEdge)

      const soloEdge = selEdge.edges.find(edge => formatBiolinkEntity(edge.predicate) === selEdge.predicate);
      const formatted = getFormattedEdgeLabel(soloEdge.subject.name, soloEdge.predicate, soloEdge.object.name).replaceAll("|", " ");
      setFormattedEdge(formatted);
    } else {
      setFormattedEdge(null);
      evidenceToDistribute(rawEvidence);
    }
    distributeEvidence(evidenceToDistribute);
  }

  const distributeEvidence = (evidence) => {
    if(!Array.isArray(evidence)) {
      setPubmedEvidence(cloneDeep([...evidence.publications].filter(item => item.type === 'PMID' || item.type === 'PMC')));
      clinicalTrials.current = cloneDeep([...evidence.publications].filter(item => item.type === 'NCT'));
      miscEvidence.current = cloneDeep([...evidence.publications].filter(item => item.type === 'other'))
        .filter((v,i,a) => a.findIndex(v2 => (v2.id === v.id)) === i);
      let displayedSources = [...evidence.sources]; 
      if (isAll) {
        displayedSources = [...evidence.distinctSources];
      }

      displayedSources.sort(compareByKeyLexographic('name'));
      setSources(displayedSources);
    }
  }

  const handleEdgeClick = (edge, rawEvi) => {
    if(!edge || checkForEdgeMatch(edge, selectedEdge) === true) 
      return;
    handleSelectedEdge(edge, rawEvi)
    setEdgeSelectedTrigger(prev=>!prev);
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className={`${styles.evidenceModal}`} containerClass={`${styles.evidenceContainer} scrollable`}>
      {selectedItem.name &&       
        <div className={styles.top}>
          <h5 className={styles.title}>{ isAll ? `All Evidence for ${selectedItem.name}` : 'Showing Evidence for:'}</h5>
          {
            !isAll &&
            formattedEdge &&
            <h5 className={styles.subtitle}>{capitalizeAllWords(formattedEdge)}</h5>
          }
          <Tooltip id="knowledge-sources-tooltip" >
            <span>The resources that provided the information supporting the selected relationship.</span>
          </Tooltip>
          {
            path &&
            <div className={styles.pathView}>
              {
                path.path.subgraph.map((pathItem, i) => {
                  let key = `${i}`;
                  let isSelected = false;
                  if(pathItem.category === "predicate" && pathItem.predicates.length > 1) {
                    return( 
                      <div className={`groupedPreds ${styles.groupedPreds}`}>
                        {
                          pathItem.predicates.map((pred, j) => {
                            let newPathItem = cloneDeep(pathItem);
                            newPathItem.predicates = [pred];
                            newPathItem.predicate = pred;
                            isSelected = (pathItem.category === "predicate" && checkForEdgeMatch(selectedEdge, newPathItem));
                            key = `${i}_${j}`;
                            return (
                              <PathObject 
                                pathObject={newPathItem} 
                                id={key}
                                key={key}
                                handleNameClick={()=>{console.log("evidence modal path object clicked!")}}
                                handleEdgeClick={(edge)=>handleEdgeClick(edge, rawEvidence)}
                                handleTargetClick={()=>{console.log("evidence modal path target clicked!")}}
                                activeStringFilters={[]}
                                selected={isSelected}
                                inModal
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
                        handleEdgeClick={(edge)=>handleEdgeClick(edge, rawEvidence)}
                        handleTargetClick={()=>{console.log("evidence modal path target clicked!")}}
                        activeStringFilters={[]}
                        selected={isSelected}
                        inModal
                      />
                    ) 
                  }
                }) 
              }
            </div>
          }
          <Tabs isOpen={isOpen}>
            {
              pubmedEvidence.length > 0 &&
              <div heading="Publications">
                <PublicationsTable
                  selectedEdgeTrigger={selectedEdgeTrigger}
                  pubmedEvidence={pubmedEvidence} 
                  setPubmedEvidence={setPubmedEvidence}
                  handleEvidenceSort={handleEvidenceSort}
                  item={item}
                  prefs={prefs}
                  isOpen={isOpen}
                />
              </div>
            }
            {
              clinicalTrials.current.length > 0 &&
              <div heading="Clinical Trials">
                <div className={`table-body ${styles.tableBody} ${styles.clinicalTrials}`}>
                  <div className={`table-head ${styles.tableHead}`}>
                    <div className={`head ${styles.head} ${styles.link}`}>Link</div>
                  </div>
                  <div className={`table-items ${styles.tableItems}`}>
                    {
                      clinicalTrials.current.map((item, i)=> {
                        return (
                          <div className={styles.tableItem} key={i}>
                            <div className={`table-cell ${styles.cell} ${styles.link} link`}>
                              {item.url && <a href={item.url} rel="noreferrer" target="_blank">{item.url} <ExternalLink/></a>}
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              </div>
            }
            {
              miscEvidence.current.length > 0 &&
              <div heading="Miscellaneous">
                <div className={`table-body ${styles.tableBody} ${styles.misc}`}>
                  <div className={`table-head ${styles.tableHead}`}>
                    <div className={`head ${styles.head} ${styles.link}`}>Link</div>
                  </div>
                  <div className={`table-items ${styles.tableItems}`}>
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
              </div>
            }
            {
              // Add sources modal for predicates
              sources.length > 0 &&
              <div 
                heading="Knowledge Sources" 
                tooltipIcon={<Information className={styles.infoIcon} />}
                data-tooltip-id="knowledge-sources-tooltip" 
                >
                <div className={`table-body ${styles.tableBody} ${isAll ? styles.distinctSources : styles.sources}`}>
                  <div className={`table-head ${styles.tableHead}`}>
                    <div className={`head ${styles.head}`}>Source</div>
                    <div className={`head ${styles.head}`}>Link</div>
                  </div>
                  <div className={`table-items ${styles.tableItems}`}>
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
                              <a key={i} href={url} target="_blank" rel="noreferrer" className={`url ${styles.edgeProvenanceLink}`}>
                                {url}
                                <ExternalLink/>
                              </a>
                            </span>
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              </div>
            }
            {
              clinicalTrials.current.length <= 0 &&
              pubmedEvidence.length <= 0 &&
              sources.length <= 0 &&
              <div heading="No Evidence Available">
                <p className={styles.noEvidence}>No evidence is currently available for this item.</p>
              </div>
            }
          </Tabs>
        </div>
      }
    </Modal>
  );
}


export default EvidenceModal;