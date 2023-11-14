import {useState, useEffect, useCallback, useRef} from "react";
import Modal from "./Modal";
import Tabs from "../Tabs/Tabs";
import PathObject from "../PathObject/PathObject";
import styles from './EvidenceModal.module.scss';
import ExternalLink from '../../Icons/external-link.svg?react';
import { capitalizeAllWords } from "../../Utilities/utilities";
import { sortNameHighLow, sortNameLowHigh, sortSourceHighLow, sortSourceLowHigh,
         compareByKeyLexographic, sortDateYearHighLow, sortDateYearLowHigh } from '../../Utilities/sortingFunctions';
import { getFormattedEdgeLabel } from '../../Utilities/resultsFormattingFunctions';
import { checkForEdgeMatch, handleEvidenceSort } from "../../Utilities/evidenceModalFunctions";
import { cloneDeep, chunk } from "lodash";
import { useQuery } from "react-query";
import { useSelector } from 'react-redux';
import { currentPrefs } from '../../Redux/rootSlice';
import Information from '../../Icons/information.svg?react';
import Tooltip from "../Tooltip/Tooltip";
import PublicationsTable from "../EvidenceTables/PublicationsTable";

const EvidenceModal = ({path = null, isOpen, onClose, rawEvidence, item, isAll, edgeGroup = null}) => {

  const prefs = useSelector(currentPrefs);

  // update defaults when prefs change, including when they're loaded from the db since the call for new prefs  
  // comes asynchronously in useEffect (which is at the end of the render cycle) in App.js 
  useEffect(() => {
    const tempItemsPerPage = (prefs?.evidence_per_screen?.pref_value) ? parseInt(prefs.evidence_per_screen.pref_value) : 10;
    setItemsPerPage(parseInt(tempItemsPerPage));
  }, [prefs]);
  const initItemsPerPage = parseInt((prefs?.evidence_per_screen?.pref_value) ? parseInt(prefs.evidence_per_screen.pref_value) : 5);

  const [pubmedEvidence, setPubmedEvidence] = useState([]);
  const [sources, setSources] = useState([]);
  const clinicalTrials = useRef([]);
  const miscEvidence = useRef([]);
  const hasBeenOpened = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState({});
  const [selectedEdge, setSelectedEdge] = useState(edgeGroup);
  const [formattedEdge, setFormattedEdge] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(initItemsPerPage);
  const [displayedPubmedEvidence, setDisplayedPubmedEvidence] = useState([]);
  const [isSortedByTitle, setIsSortedByTitle] = useState(null);
  const [isSortedBySource, setIsSortedBySource] = useState(null);
  const [isSortedByDate, setIsSortedByDate] = useState(null);

  useEffect(() => {
    setSelectedItem(item);
  }, [item])

  const sortingSetters = {
    setIsSortedByTitle: setIsSortedByTitle,
    setIsSortedBySource: setIsSortedBySource,
    setIsSortedByDate: setIsSortedByDate,
    setPubmedEvidence: setPubmedEvidence
  }

  // Int, number of pages
  const [pageCount, setPageCount] = useState(0);
  // Int, current item offset (ex: on page 3, offset would be 30 based on itemsPerPage of 10)
  const [itemOffset, setItemOffset] = useState(0);
  // Int, current page
  const [currentPage, setCurrentPage] = useState(0);
  const endOffset = (itemOffset + itemsPerPage > pubmedEvidence.length)
  ? pubmedEvidence.length
  :  itemOffset + itemsPerPage;

  const [processedEvidenceIDs, setProcessedEvidenceIDs] = useState([]);
  const queryAmount = 200;

  const amountOfIDsProcessed = useRef(0);
  const evidenceToUpdate = useRef(null);
  const isFetchingPubmedData = useRef(false);
  const fetchedPubmedData = useRef(false);
  const didMountRef = useRef(false);

  const pubTablePageData = {
    itemOffset: itemOffset,
    endOffset: endOffset,
    itemsPerPage: itemsPerPage,
    currentPage: currentPage,
    pageCount: pageCount
  }

  const handleClose = () => {
    onClose();
    setCurrentPage(0);
    setItemOffset(0);
    setSelectedEdge(null);
    setIsLoading(true);
    setIsSortedBySource(null);
    setIsSortedByTitle(null);
    setIsSortedByDate(null);
    amountOfIDsProcessed.current = 0;
    evidenceToUpdate.current = null;
    fetchedPubmedData.current = false;
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

  // filter publications/sources based on a selectedEdge
  const filterEvidenceObjs = (objs, selectedEdge, container) => {
    const selectedEdgeLabel = getFormattedEdgeLabel(selectedEdge.subject.name, selectedEdge.predicate, selectedEdge.object.name);
    for (const obj of objs) {
      let proceed = false;
      if(Array.isArray(obj.edges) && obj.edges[0].label === selectedEdgeLabel) {
        proceed = true;
      } else if(obj.edges[selectedEdge.id] !== undefined) {
        proceed = true;
      }

      if(proceed) {
        const includedObj = cloneDeep(obj);
        let filteredEdges = {};
        filteredEdges[selectedEdge.id] = (obj.edges[selectedEdge.id] !== undefined)
          ? includedObj.edges[selectedEdge.id]
          : includedObj.edges[0];
        includedObj.edges = filteredEdges;

        container.push(includedObj);
      }
    }
  }
  // filters evidence based on provided selectedEdge (if any, otherwise returns full evidence), 
  // called in useEffect tracking selectedEdge (to accommodate both in-component edge selection and edgeGroup prop change)
  const handleSelectedEdge = (selEdge, rawEvidence) => {
    let evidenceToDistribute;
    if(!Array.isArray(selEdge) && typeof selEdge === 'object' && selEdge !== null) {
      let filteredEvidence = {
        publications: [],
        sources: []
      };
    
      let filteredPublications = filteredEvidence.publications;
      let filteredSources = filteredEvidence.sources;

      const edgeToFilterBy = selEdge.edges.find((edge)=> edge.predicate === selEdge.predicate);
      filterEvidenceObjs(rawEvidence.publications, edgeToFilterBy, filteredPublications);
      filterEvidenceObjs(rawEvidence.sources, edgeToFilterBy, filteredSources);
      
      evidenceToDistribute = filteredEvidence;
      setSelectedEdge(selEdge)

      const soloEdge = selEdge.edges.find(edge => edge.predicate === selEdge.predicate);
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
      setPubmedEvidence(cloneDeep(evidence.publications.filter(item => item.type === 'PMID' || item.type === 'PMC')));
      clinicalTrials.current = cloneDeep(evidence.publications.filter(item => item.type === 'NCT'));
      miscEvidence.current = cloneDeep(evidence.publications.filter(item => item.type === 'other'))
        .filter((v,i,a) => a.findIndex(v2 => (v2.id === v.id)) === i);
      let displayedSources = evidence.sources; 
      if (isAll) {
        displayedSources = evidence.distinctSources;
      }

      displayedSources.sort(compareByKeyLexographic('name'));
      setSources(displayedSources);
    }
  }

  // hook to handle setting the correct evidence when itemOffset or itemsPerPage change
  useEffect(() => {
    setDisplayedPubmedEvidence(pubmedEvidence.slice(itemOffset, endOffset));
    setPageCount(Math.ceil(pubmedEvidence.length / itemsPerPage));
  }, [itemOffset, itemsPerPage, pubmedEvidence, endOffset]);

  // Handles direct page click
  const handlePageClick = useCallback((event) => {
    const newOffset = (event.selected * itemsPerPage) % pubmedEvidence.length;
    setCurrentPage(event.selected);
    setItemOffset(newOffset);
  },[itemsPerPage, pubmedEvidence]);

  const pubTableEventHandlers = {
    handlePageClick: handlePageClick,
    handleEvidenceSort: handleEvidenceSort,
    setItemsPerPage: setItemsPerPage
  }

  const insertAdditionalPubmedData = (data, pubmedEvidence) => {
    let newPubmedEvidence = cloneDeep(pubmedEvidence)
    for(const element of newPubmedEvidence) {
      if(data[element.id] !== undefined) {
        if(!element.source)
          element.source = capitalizeAllWords(data[element.id].journal_name);
        if(!element.title)
          element.title = capitalizeAllWords(data[element.id].article_title.replace('[', '').replace(']',''));
        if(!element.snippet)
          element.snippet = data[element.id].abstract;
        if(!element.pubdate) {
          let year = (data[element.id].pub_year) ? data[element.id].pub_year: 0;
          element.pubdate = year;
        }
      }
      element.updated = true;
    }
    return newPubmedEvidence;
  }

  useEffect(()=> {
    if(pubmedEvidence.length <= 0 && didMountRef.current) {
      setIsLoading(false);
      return;
    }
    didMountRef.current = true;

    if(pubmedEvidence.length <= 0)
      return;

    if(fetchedPubmedData.current) {
      setIsLoading(false);
    } else {
      let PMIDs = pubmedEvidence.map(item => item.id);
      setProcessedEvidenceIDs(chunk(PMIDs, queryAmount));
      isFetchingPubmedData.current = true;
    }
  }, [pubmedEvidence])

  const insertAdditionalEvidenceAndSort = (prefs, insertAdditionalPubmedData) => {
    if(prefs?.evidence_sort?.pref_value) {
      let dataToSort = insertAdditionalPubmedData(evidenceToUpdate.current, pubmedEvidence);
      switch (prefs.evidence_sort.pref_value) {
        case "dateHighLow":
          setIsSortedByDate(true);
          setPubmedEvidence(sortDateYearHighLow(dataToSort));
          break;
        case "dateLowHigh":
          setIsSortedByDate(false);
          setPubmedEvidence(sortDateYearLowHigh(dataToSort));
          break;
        case "sourceHighLow":
          setIsSortedBySource(false);
          setPubmedEvidence(sortSourceHighLow(dataToSort));
          break;
        case "sourceLowHigh":
          setIsSortedBySource(true);
          setPubmedEvidence(sortSourceLowHigh(dataToSort));
          break;
        case "titleHighLow":
          setIsSortedByTitle(false);
          setPubmedEvidence(sortNameHighLow(dataToSort, true))
          break;      
        case "titleLowHigh":
          setIsSortedByTitle(true);
          setPubmedEvidence(sortNameLowHigh(dataToSort, true))
          break;            
        default:
          break;
      }
    } else {
      setIsSortedByDate(true);
    }
  }

  // retrieves pubmed metadata, then inserts it into the existing evidence and sorts
  // called in useQuery hook below, controlled by isFetchingPubmedData ref
  const fetchPubmedData = async (processedEvidenceIDs, pubmedEvidenceLength, insertAndSortEvidence, prefs) => {
    const metadata = processedEvidenceIDs.map(async (ids, i) => {
      const response = await fetch(`https://docmetadata.transltr.io/publications?pubids=${ids}&request_id=26394fad-bfd9-4e32-bb90-ef9d5044f593`)
      .then(response => response.json())
      .then(data => {
        evidenceToUpdate.current = {...evidenceToUpdate.current, ...data.results } ;
        amountOfIDsProcessed.current = amountOfIDsProcessed.current + Object.keys(data.results).length;
        if(amountOfIDsProcessed.current >= pubmedEvidenceLength) {
          console.log('metadata fetches complete, inserting additional evidence information')
          insertAndSortEvidence(prefs, insertAdditionalPubmedData);
          fetchedPubmedData.current = true;
          isFetchingPubmedData.current = false;
        }
      })
      return response;
    })
    return Promise.all(metadata);
  }
  // eslint-disable-next-line
  const pubMedMetadataQuery = useQuery({
    queryKey: ['pubmedMetadata'],
    queryFn: () => fetchPubmedData(processedEvidenceIDs, pubmedEvidence.length, insertAdditionalEvidenceAndSort, prefs),
    refetchInterval: 1000,
    enabled: isFetchingPubmedData.current
  });

  const handleEdgeClick = (edge, rawEvi) => {
    if(!edge || checkForEdgeMatch(edge, selectedEdge) === true) 
      return;
    setEdgeAndResetView(edge, rawEvi);
  }

  const setEdgeAndResetView = (edge, rawEvi) => {
    setIsLoading(true);
    setCurrentPage(0);
    setItemOffset(0);
    handleSelectedEdge(edge, rawEvi)
    amountOfIDsProcessed.current = 0;
    evidenceToUpdate.current = null;
    fetchedPubmedData.current = false;
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
                  pubmedEvidence={pubmedEvidence} 
                  itemOffset={itemOffset}
                  endOffset={endOffset}
                  displayedPubmedEvidence={displayedPubmedEvidence} 
                  handlePageClick={handlePageClick} 
                  handleEvidenceSort={handleEvidenceSort}
                  sortingSetters={sortingSetters} 
                  sortingStates={{
                    isSortedByDate: isSortedByDate,
                    isSortedBySource: isSortedBySource,
                    isSortedByTitle: isSortedByTitle
                  }} 
                  pageData={pubTablePageData}
                  eventHandlers={pubTableEventHandlers}
                  isLoading={isLoading}
                  item={item}
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
                tooltipIcon={<Information className={styles.infoIcon} 
                data-tooltip-id="knowledge-sources-tooltip" />}
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