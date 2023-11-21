import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import ExternalLink from '../../Icons/external-link.svg?react';
import LoadingBar from "../LoadingBar/LoadingBar";
import styles from './PublicationsTable.module.scss';
import Select from '../FormFields/Select';
import ReactPaginate from "react-paginate";
import { handleEvidenceSort, updatePubdate, updateSnippet, updateSource, 
  updateTitle, getKnowledgeLevelString  } from "../../Utilities/evidenceModalFunctions";
import { sortNameHighLow, sortNameLowHigh, sortSourceHighLow, sortSourceLowHigh,
  sortDateYearHighLow, sortDateYearLowHigh } from '../../Utilities/sortingFunctions';
import { cloneDeep, chunk } from "lodash";
import { useQuery } from "react-query";
import Info from '../../Icons/information.svg?react';

const PublicationsTable = ({ selectedEdgeTrigger, pubmedEvidence, setPubmedEvidence, item, prefs = null, isOpen }) => {

  const availableKnowledgeLevels = useMemo(() => {
    return new Set(pubmedEvidence.map(pub => pub.knowledgeLevel));
  }, [pubmedEvidence]);  

  const prevSelectedEdgeTrigger = useRef(selectedEdgeTrigger);
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(prefs?.evidence_per_screen?.pref_value) || 5);
  const [displayedPubmedEvidence, setDisplayedPubmedEvidence] = useState([]);
  const [knowledgeLevelFilter, setKnowledgeLevelFilter] = useState('all');
  const filteredEvidence = useMemo(() => {
    if (knowledgeLevelFilter === 'all') 
      return pubmedEvidence;
    return pubmedEvidence.filter(evidence => evidence.knowledgeLevel === knowledgeLevelFilter);
  }, [pubmedEvidence, knowledgeLevelFilter]);
  const [pageCount, setPageCount] = useState(0);
  const [itemOffset, setItemOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const endOffset = (itemOffset + itemsPerPage > filteredEvidence.length)
    ? filteredEvidence.length
    :  itemOffset + itemsPerPage;
  const [sortingState, setSortingState] = useState({ title: null, source: null, date: null });
  const [isLoading, setIsLoading] = useState(true);
  const didMountRef = useRef(false);
  const isFetchingPubmedData = useRef(false);
  const fetchedPubmedData = useRef(false);
  const queryAmount = 200;
  const [processedEvidenceIDs, setProcessedEvidenceIDs] = useState([])
  const amountOfIDsProcessed = useRef(0);
  const evidenceToUpdate = useRef(null);

  // Handles direct page click
  const handlePageClick = useCallback((event) => {
    const newOffset = (event.selected * itemsPerPage) % filteredEvidence.length;
    setCurrentPage(event.selected);
    setItemOffset(newOffset);
  },[itemsPerPage, filteredEvidence]);

  const handleClose = () => {
    setIsLoading(true);
    setCurrentPage(0);
    setItemOffset(0);
    setSortingState({ title: null, source: null, date: null });
    setKnowledgeLevelFilter('all')
    amountOfIDsProcessed.current = 0;
    evidenceToUpdate.current = null;
    fetchedPubmedData.current = false;
  }

  const insertAdditionalPubmedData = (data, pubmedEvidence) => {
    let newPubmedEvidence = cloneDeep(pubmedEvidence)
    for(const element of newPubmedEvidence) {
      if(data[element.id] !== undefined) {
        updateSource(element, data);
        updateTitle(element, data);
        updateSnippet(element, data);
        updatePubdate(element, data);
      }
      element.updated = true;
    }
    return newPubmedEvidence;
  }

  const insertAdditionalEvidenceAndSort = (prefs, insertAdditionalPubmedData) => {
    if(prefs?.evidence_sort?.pref_value) {
      let dataToSort = insertAdditionalPubmedData(evidenceToUpdate.current, pubmedEvidence);
      switch (prefs.evidence_sort.pref_value) {
        case "dateHighLow":
          setSortingState(prev => ({...prev, date: true}));
          setPubmedEvidence(sortDateYearHighLow(dataToSort));
          break;
        case "dateLowHigh":
          setSortingState(prev => ({...prev, date: false}));
          setPubmedEvidence(sortDateYearLowHigh(dataToSort));
          break;
        case "sourceHighLow":
          setSortingState(prev => ({...prev, source: false}));
          setPubmedEvidence(sortSourceHighLow(dataToSort));
          break;
        case "sourceLowHigh":
          setSortingState(prev => ({...prev, source: true}));
          setPubmedEvidence(sortSourceLowHigh(dataToSort));
          break;
        case "titleHighLow":
          setSortingState(prev => ({...prev, title: false}));
          setPubmedEvidence(sortNameHighLow(dataToSort, true))
          break;      
        case "titleLowHigh":
          setSortingState(prev => ({...prev, title: true}));
          setPubmedEvidence(sortNameLowHigh(dataToSort, true))
          break;            
        default:
          break;
      }
    } else {
      setSortingState(prev => ({...prev, date: true}));
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

  const setupPubmedDataFetch = (evidence, processedIDsSetter) => {
    let PMIDs = evidence.map(item => item.id);
    processedIDsSetter(chunk(PMIDs, queryAmount));
    isFetchingPubmedData.current = true;
  }

  useEffect(()=> {
    if(pubmedEvidence.length <= 0 && didMountRef.current) {
      setIsLoading(false);
      return;
    }
    didMountRef.current = true;
    
    if(pubmedEvidence.length <= 0) 
      return;

    if(fetchedPubmedData.current) 
      setIsLoading(false);
    else 
      setupPubmedDataFetch(pubmedEvidence, setProcessedEvidenceIDs);
    

    const resetView = () => {
      setIsLoading(true);
      setCurrentPage(0);
      setItemOffset(0);
      setSortingState({ title: null, source: null, date: true });
      amountOfIDsProcessed.current = 0;
      evidenceToUpdate.current = null;
      fetchedPubmedData.current = false;
      setupPubmedDataFetch(pubmedEvidence, setProcessedEvidenceIDs);
    }
    if(prevSelectedEdgeTrigger.current !== selectedEdgeTrigger) {
      resetView();
      prevSelectedEdgeTrigger.current = selectedEdgeTrigger;
    }
  }, [pubmedEvidence, selectedEdgeTrigger])

  // update defaults when prefs change, including when they're loaded from the db since the call for new prefs  
  // comes asynchronously in useEffect (which is at the end of the render cycle) in App.js 
  useEffect(() => {
    const tempItemsPerPage = (prefs?.evidence_per_screen?.pref_value) ? parseInt(prefs.evidence_per_screen.pref_value) : 10;
    setItemsPerPage(parseInt(tempItemsPerPage));
  }, [prefs]);

  useEffect(() => {
    if(!isOpen) 
      handleClose();
  }, [isOpen]);

  // hook to handle setting the correct evidence when itemOffset or itemsPerPage change
  useEffect(() => {
    setDisplayedPubmedEvidence(filteredEvidence.slice(itemOffset, endOffset));
    setPageCount(Math.ceil(filteredEvidence.length / itemsPerPage));
  }, [itemOffset, itemsPerPage, filteredEvidence, endOffset]);

  return(
    <div className={styles.publicationsTableContainer}>
      <div className={styles.top}>
        {
          filteredEvidence.length > 0
            ? <p className={styles.evidenceCount}>Showing {itemOffset + 1}-{endOffset} of {filteredEvidence.length} {filteredEvidence.length !== pubmedEvidence.length && `(${pubmedEvidence.length}) `}Publications</p>
            : <p className={styles.evidenceCount}>Showing 0-0 of 0 ({pubmedEvidence.length}) Publications</p>
        }
        <div className={styles.knowledgeLevel}>
          <p className={styles.knowledgeLevelabel}>Knowledge Level <Info/></p>
          <div>
            <button 
              className={`${styles.knowledgeLevelButton} ${knowledgeLevelFilter === 'all' ? styles.selected : ''}`} 
              onClick={() => setKnowledgeLevelFilter('all')}>
              All
            </button>
            <button 
              className={`${styles.knowledgeLevelButton} ${knowledgeLevelFilter === 'trusted' ? styles.selected : ''}`} 
              onClick={() => setKnowledgeLevelFilter('trusted')}
              disabled={!availableKnowledgeLevels.has('trusted')}>
              Curated
            </button>
            <button 
              className={`${styles.knowledgeLevelButton} ${knowledgeLevelFilter === 'ml' ? styles.selected : ''}`} 
              onClick={() => setKnowledgeLevelFilter('ml')}
              disabled={!availableKnowledgeLevels.has('ml')}>
              Text-Mined
            </button>
          </div>
        </div>
      </div>
      <table className={`table-body ${styles.pubsTable}`}>
        <thead className={`table-head`}>
          <tr>
            <th className={`head ${styles.knowledgeLevel}`}>Knowledge Level</th>
            <th 
              className={`head ${styles.pubdate} ${sortingState.date ? 'true' : (sortingState.date === null) ? '' : 'false'}`}
              onClick={()=>{handleEvidenceSort((sortingState.date) ? 'dateLowHigh': 'dateHighLow', pubmedEvidence, handlePageClick, setSortingState, setPubmedEvidence)}}
              >
              <span className={`head-span`}>
                Date(s)
              </span>
            </th>
            <th
              className={`head ${styles.source} ${sortingState.source ? 'true' : (sortingState.source === null) ? '' : 'false'}`}
              onClick={()=>{handleEvidenceSort((sortingState.source) ? 'sourceHighLow': 'sourceLowHigh', pubmedEvidence, handlePageClick, setSortingState, setPubmedEvidence)}}
              >
              <span className={`head-span`}>
                Journal
              </span>
            </th>
            <th
              className={`head ${styles.title} ${sortingState.title ? 'true' : (sortingState.title === null) ? '' : 'false'}`}
              onClick={()=>{handleEvidenceSort((sortingState.title) ? 'titleHighLow': 'titleLowHigh', pubmedEvidence, handlePageClick, setSortingState, setPubmedEvidence)}}
              >
              <span className={`head-span`}>
                Title
              </span>
            </th>
            <th className={`head ${styles.abstract}`}>Snippet</th>
          </tr>
        </thead>
        {
          isLoading &&
          <LoadingBar
            loading={isLoading}
            useIcon
            className={styles.loadingBar}
            loadingText="Retrieving Evidence"
          />
        }
        {
          !isLoading &&
          <tbody className={`table-items`} >
            {
              displayedPubmedEvidence.length === 0
              ? <p className={styles.noPubs}>No publications available.</p>
              :
                displayedPubmedEvidence.map((pub, i)=> {
                  const knowledgeLevel = (pub?.knowledgeLevel) ? pub.knowledgeLevel : item?.evidence?.distinctSources[0]?.knowledgeLevel;
                  let knowledgeLevelString = getKnowledgeLevelString(knowledgeLevel);
                  return (
                    <tr className={`table-item`} key={i}>
                      <td className={`table-cell ${styles.tableCell} ${styles.knowledgeLevel}`}>
                        {knowledgeLevelString}
                      </td>
                      <td className={`table-cell ${styles.tableCell} ${styles.pubdate} pubdate`}>
                        {pub.pubdate && (pub.pubdate === 0 ) ? '' : pub.pubdate }
                      </td>
                      <td className={`table-cell ${styles.tableCell} ${styles.source} source`}>
                        <span>
                          {pub.source && pub.source }
                        </span>
                      </td>
                      <td className={`table-cell ${styles.tableCell} ${styles.title} title`} >
                        {pub.title && pub.url && <a href={pub.url} target="_blank" rel="noreferrer">{pub.title}</a> }
                        {!pub.title && pub.url && <a href={pub.url} target="_blank" rel="noreferrer">No Title Available</a> }
                      </td>
                      <td className={`table-cell ${styles.tableCell} ${styles.snippet}`}>
                        <span>
                          {
                            pub.snippet 
                              ? pub.snippet
                              : "No snippet available."
                          }
                        </span>
                          {pub.url && <a href={pub.url} className={`url ${styles.url}`} target="_blank" rel="noreferrer">Read More <ExternalLink/></a>}
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        }
      </table>
      <div className={styles.bottom}>
        <div className={styles.perPage}>
          <Select
            label=""
            name="Items Per Page"
            size="m"
            handleChange={(value)=>{
              setItemsPerPage(parseInt(value));
              handlePageClick({selected: 0});
            }}
            value={itemsPerPage}
            >
            <option value="5" key="0">5</option>
            <option value="10" key="1">10</option>
            <option value="20" key="2">20</option>
          </Select>
        </div>
        <div className={styles.pagination}>
          <ReactPaginate
            breakLabel="..."
            nextLabel="Next"
            previousLabel="Previous"
            onPageChange={handlePageClick}
            pageRangeDisplayed={2}
            marginPagesDisplayed={2}
            pageCount={pageCount}
            renderOnZeroPageCount={null}
            className={styles.pageNums}
            pageClassName={styles.pageNum}
            activeClassName={styles.current}
            previousLinkClassName={`${styles.prev} ${styles.button}`}
            nextLinkClassName={`${styles.prev} ${styles.button}`}
            disabledLinkClassName={styles.disabled}
            forcePage={currentPage}
          />
        </div>
      </div>
    </div>
  )
}

export default PublicationsTable;