import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import ExternalLink from '../../Icons/external-link.svg?react';
import LoadingBar from "../LoadingBar/LoadingBar";
import styles from './PublicationsTable.module.scss';
import Select from '../FormFields/Select';
import ReactPaginate from "react-paginate";
import { handleEvidenceSort } from "../../Utilities/evidenceModalFunctions";
import { sortNameHighLow, sortNameLowHigh, sortSourceHighLow, sortSourceLowHigh,
  sortDateYearHighLow, sortDateYearLowHigh } from '../../Utilities/sortingFunctions';
import { cloneDeep, chunk } from "lodash";
import { useQuery } from "react-query";
import { capitalizeAllWords } from "../../Utilities/utilities";
import Info from '../../Icons/information.svg?react';

const PublicationsTable = ({ selectedEdgeTrigger, pubmedEvidence, setPubmedEvidence, item, prefs = null, isOpen }) => {

  const initItemsPerPage = parseInt((prefs?.evidence_per_screen?.pref_value) ? parseInt(prefs.evidence_per_screen.pref_value) : 5);
  const prevSelectedEdgeTrigger = useRef(selectedEdgeTrigger);
  const [itemsPerPage, setItemsPerPage] = useState(initItemsPerPage);
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
  const [isSortedByTitle, setIsSortedByTitle] = useState(null);
  const [isSortedBySource, setIsSortedBySource] = useState(null);
  const [isSortedByDate, setIsSortedByDate] = useState(null);
  const sortingSetters = {
    setIsSortedByTitle: setIsSortedByTitle,
    setIsSortedBySource: setIsSortedBySource,
    setIsSortedByDate: setIsSortedByDate,
    setPubmedEvidence: setPubmedEvidence
  }
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
    setIsSortedBySource(null);
    setIsSortedByTitle(null);
    setIsSortedByDate(null);
    setKnowledgeLevelFilter('all')
    amountOfIDsProcessed.current = 0;
    evidenceToUpdate.current = null;
    fetchedPubmedData.current = false;
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
    if(!isOpen) {
      handleClose();
    }
  }, [isOpen]);

  // hook to handle setting the correct evidence when itemOffset or itemsPerPage change
  useEffect(() => {
    setDisplayedPubmedEvidence(filteredEvidence.slice(itemOffset, endOffset));
    setPageCount(Math.ceil(filteredEvidence.length / itemsPerPage));
  }, [itemOffset, itemsPerPage, filteredEvidence, endOffset]);

  // useEffect(() => {


  //   if(didMountRef.current)
  //     resetView();
  // }, [selectedEdgeTrigger]);

  return(
    <div className={styles.publicationsTableContainer}>
      <div className={styles.top}>
        {
          filteredEvidence.length > 0
            ? <p className={styles.evidenceCount}>Showing {itemOffset + 1}-{endOffset} of {filteredEvidence.length} {filteredEvidence.length !== pubmedEvidence.length && `(${pubmedEvidence.length}) `}Publications</p>
            : <p className={styles.evidenceCount}>Showing 0-0 of 0 ({pubmedEvidence.length}) Publications</p>
        }
        <div className={styles.knowledgeType}>
          <p className={styles.knowledgeTypeLabel}>Knowledge Type <Info/></p>
          <div>
            <button 
              className={`${styles.knowledgeTypeButton} ${knowledgeLevelFilter === 'all' ? styles.selected : ''}`} 
              onClick={() => setKnowledgeLevelFilter('all')}>
              All
            </button>
            <button 
              className={`${styles.knowledgeTypeButton} ${knowledgeLevelFilter === 'trusted' ? styles.selected : ''}`} 
              onClick={() => setKnowledgeLevelFilter('trusted')}
              >Curated
            </button>
            <button 
              className={`${styles.knowledgeTypeButton} ${knowledgeLevelFilter === 'ml' ? styles.selected : ''}`} 
              onClick={() => setKnowledgeLevelFilter('ml')}>
              Text-Mined
            </button>
          </div>
        </div>
      </div>
      <div className={`table-body ${styles.pubsTable}`}>
        <div className={`table-head`}>
          <div className={`head ${styles.knowledgeLevel}`}>Knowledge Level</div>
          <div 
            className={`head ${styles.pubdate} ${isSortedByDate ? 'true' : (isSortedByDate === null) ? '' : 'false'}`}
            onClick={()=>{handleEvidenceSort((isSortedByDate) ? 'dateLowHigh': 'dateHighLow', pubmedEvidence, handlePageClick, sortingSetters)}}
            >
            <span className={`head-span`}>
              Date(s)
            </span>
          </div>
          <div
            className={`head ${styles.source} ${isSortedBySource ? 'true' : (isSortedBySource === null) ? '' : 'false'}`}
            onClick={()=>{handleEvidenceSort((isSortedBySource) ? 'sourceHighLow': 'sourceLowHigh', pubmedEvidence, handlePageClick, sortingSetters)}}
            >
            <span className={`head-span`}>
              Journal
            </span>
          </div>
          <div
            className={`head ${styles.title} ${isSortedByTitle ? 'true' : (isSortedByTitle === null) ? '' : 'false'}`}
            onClick={()=>{handleEvidenceSort((isSortedByTitle) ? 'titleHighLow': 'titleLowHigh', pubmedEvidence, handlePageClick, sortingSetters)}}
            >
            <span className={`head-span`}>
              Title
            </span>
          </div>
          <div className={`head ${styles.abstract}`}>Snippet</div>
        </div>
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
          <div className={`table-items`} >
            {
              displayedPubmedEvidence.length === 0
              ? <p className={styles.noPubs}>No publications available.</p>
              :
                displayedPubmedEvidence.map((pub, i)=> {
                  const knowledgeLevel = (pub?.knowledgeLevel) ? pub.knowledgeLevel : item?.evidence?.distinctSources[0]?.knowledgeLevel;
                  let knowledgeLevelString;
                    switch (knowledgeLevel) {
                      case 'trusted':
                        knowledgeLevelString = 'Curated'
                        break;
                      case 'ml':
                        knowledgeLevelString = 'Text-Mined'
                        break;
                      default:
                        knowledgeLevelString = 'Unknown';
                        break;
                    }
                  return (
                    <div className={`table-item`} key={i}>
                      <span className={`table-cell ${styles.tableCell} ${styles.knowledgeLevel}`}>
                        {knowledgeLevelString}
                      </span>
                      <span className={`table-cell ${styles.tableCell} ${styles.pubdate} pubdate`}>
                        {pub.pubdate && (pub.pubdate === 0 ) ? '' : pub.pubdate }
                      </span>
                      <span className={`table-cell ${styles.tableCell} ${styles.source} source`}>
                        <span>
                          {pub.source && pub.source }
                        </span>
                      </span>
                      <span className={`table-cell ${styles.tableCell} ${styles.title} title`} >
                        {pub.title && pub.url && <a href={pub.url} target="_blank" rel="noreferrer">{pub.title}</a> }
                        {!pub.title && pub.url && <a href={pub.url} target="_blank" rel="noreferrer">No Title Available</a> }
                      </span>
                      <span className={`table-cell ${styles.tableCell} ${styles.snippet}`}>
                        <span>
                          {
                            pub.snippet 
                              ? pub.snippet
                              : "No snippet available."
                          }
                        </span>
                          {pub.url && <a href={pub.url} className={`url ${styles.url}`} target="_blank" rel="noreferrer">Read More <ExternalLink/></a>}
                      </span>
                    </div>
                  )
                })
            }
          </div>
        }
      </div>
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