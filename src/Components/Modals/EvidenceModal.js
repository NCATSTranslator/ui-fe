import React, {useState, useEffect, useCallback, useRef} from "react";
import Modal from "./Modal";
import Tabs from "../Tabs/Tabs";
import Select from "../FormFields/Select";
import LoadingBar from "../LoadingBar/LoadingBar";
import styles from './EvidenceModal.module.scss';
import ReactPaginate from "react-paginate";
import {ReactComponent as ExternalLink} from '../../Icons/external-link.svg';
import { capitalizeAllWords } from "../../Utilities/utilities";
import { sortNameHighLow, sortNameLowHigh, sortSourceHighLow, sortSourceLowHigh } from '../../Utilities/sortingFunctions';
import { cloneDeep, chunk } from "lodash";
import { useQuery } from "react-query";

const EvidenceModal = ({isOpen, onClose, currentEvidence, title, edges}) => {

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpen = startOpen;

  const [pubmedEvidence, setPubmedEvidence] = useState([]);
  const clinicalTrials = useRef([]);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedTabToggle, setSelectedTabToggle] = useState(true);
  const [evidenceTitle, setEvidenceTitle] = useState(title ? title : 'All Evidence')
  const [formattedEvidenceEdges, setFormattedEvidenceEdges] = useState(null)
  const [rawEvidenceEdges, setRawEvidenceEdges] = useState(null)
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const itemCountClass = useRef(styles.five);
  const [newItemsPerPage, setNewItemsPerPage] = useState(null);
  const [displayedPubmedEvidence, setDisplayedPubmedEvidence] = useState([]);
  const [isSortedByTitle, setIsSortedByTitle] = useState(null);
  const [isSortedBySource, setIsSortedBySource] = useState(null);
  // Int, number of pages
  const [pageCount, setPageCount] = useState(0);
  // Int, current item offset (ex: on page 3, offset would be 30 based on itemsPerPage of 10)
  const [itemOffset, setItemOffset] = useState(0);
  // Int, current page
  const [currentPage, setCurrentPage] = useState(0);
  const endOffset = (itemOffset + itemsPerPage > pubmedEvidence.length)
  ? pubmedEvidence.length
  : itemOffset + itemsPerPage;

  const [processedEvidenceIDs, setProcessedEvidenceIDs] = useState([]);
  const queryAmount = 200;

  const amountOfIDsProcessed = useRef(0);
  const evidenceToUpdate = useRef(null);
  const isFetchingPubmedData = useRef(false);
  const fetchedPubmedData = useRef(false);
  const didMountRef = useRef(false);

  const handleClose = () => {
    onClose();
    setCurrentPage(0);
    setItemOffset(0);
    setIsLoading(true);
    setIsSortedBySource(null);
    setIsSortedByTitle(null);
    setSelectedTabToggle(prev=>!prev);
    amountOfIDsProcessed.current = 0;
    evidenceToUpdate.current = null;
    fetchedPubmedData.current = false;
  }

  useEffect(() => {
    setEvidenceTitle(title)
  }, [title]);

  useEffect(() => {
    if(!Array.isArray(edges) && typeof edges === 'object') {
      const re = edges.edges[0];
      const formattedEdges = edges.predicates.map((p) => {
        return `${re.subject.names[0].toLowerCase()} ${p.toLowerCase()} ${re.object.names[0].toLowerCase()}`;
      });
      setFormattedEvidenceEdges(formattedEdges);
      setRawEvidenceEdges(edges);
    } else {
      setFormattedEvidenceEdges(null);
      setRawEvidenceEdges(null);
    }
  }, [edges]);

  useEffect(() => {
    setDisplayedPubmedEvidence(pubmedEvidence.slice(itemOffset, endOffset));
    setPageCount(Math.ceil(pubmedEvidence.length / itemsPerPage));
  }, [itemOffset, itemsPerPage, pubmedEvidence, endOffset]);

  useEffect(() => {
    if(isOpen) {
      setPubmedEvidence(cloneDeep(currentEvidence).filter(item => item.type === 'PMID' || item.type === 'PMC'));
      clinicalTrials.current = cloneDeep(currentEvidence).filter(item => item.type === 'NCT');
    }
  }, [currentEvidence, isOpen])

  // Handles direct page click
  const handlePageClick = useCallback((event) => {
    const newOffset = (event.selected * itemsPerPage) % pubmedEvidence.length;
    setCurrentPage(event.selected);
    setItemOffset(newOffset);
  },[itemsPerPage, pubmedEvidence]);

  const handleSort = useCallback((sortName) => {
    let sortedPubmedEvidence = cloneDeep(pubmedEvidence);
    switch (sortName) {
      case 'titleLowHigh':
        sortedPubmedEvidence = sortNameLowHigh(sortedPubmedEvidence, true);
        setIsSortedByTitle(true);
        setIsSortedBySource(null);
        break;
      case 'titleHighLow':
        sortedPubmedEvidence = sortNameHighLow(sortedPubmedEvidence, true);
        setIsSortedByTitle(false);
        setIsSortedBySource(null);
        break;
      case 'sourceLowHigh':
        sortedPubmedEvidence = sortSourceLowHigh(sortedPubmedEvidence);
        setIsSortedBySource(true);
        setIsSortedByTitle(null);
        break;
      case 'sourceHighLow':
        sortedPubmedEvidence = sortSourceHighLow(sortedPubmedEvidence);
        setIsSortedBySource(false);
        setIsSortedByTitle(null);
        break;
      default:
        break;
    }

    // assign the newly sorted results (no need to set formatted results, since they'll be filtered after being sorted, then set there)
    setPubmedEvidence(sortedPubmedEvidence);

    // reset to page one.
    handlePageClick({selected: 0});
  }, [pubmedEvidence, handlePageClick]);

  const insertAdditionalPubmedData = useCallback((data) => {

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
          let year = (data[element.id].pub_year) ? data[element.id].pub_year: '';
          let month = (data[element.id].pub_month !== '-') ? data[element.id].pub_month: '';
          let day = (data[element.id].pub_day) ? data[element.id].pub_day: '';
          element.pubdate = `${year} ${month} ${day}`;
        }
      }
      element.updated = true;
    }
    return newPubmedEvidence;
  }, [pubmedEvidence]);

  useEffect(() => {
    if(newItemsPerPage !== null) {
      setItemsPerPage(newItemsPerPage);
      setNewItemsPerPage(null);
      switch(newItemsPerPage) {
        case 20:
          itemCountClass.current = styles.twenty;
          break;
        case 10:
          itemCountClass.current = styles.ten;
          break;
        default:
          itemCountClass.current = styles.five;
          break;
      }
      handlePageClick({selected: 0});
    }
  }, [newItemsPerPage, handlePageClick]);

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

  const fetchPubmedData = useCallback(async () => {
    const metadata = processedEvidenceIDs.map(async (ids, i) => {
      const response = await fetch(`https://3md2qwxrrk.us-east-1.awsapprunner.com/publications?pubids=${ids}&request_id=26394fad-bfd9-4e32-bb90-ef9d5044f593`)
      .then(response => response.json())
      .then(data => {
        evidenceToUpdate.current = {...evidenceToUpdate.current, ...data.results } ;
        amountOfIDsProcessed.current = amountOfIDsProcessed.current + Object.keys(data.results).length;
        if(amountOfIDsProcessed.current >= pubmedEvidence.length) {
          console.log('metadata fetches complete, inserting additional evidence information')
          setPubmedEvidence(insertAdditionalPubmedData(evidenceToUpdate.current));
          fetchedPubmedData.current = true;
          isFetchingPubmedData.current = false;
        }

      })
      return response;
    })
    return Promise.all(metadata)
  }, [processedEvidenceIDs, insertAdditionalPubmedData, pubmedEvidence.length]);

  // eslint-disable-next-line
  const pubMedMetadataQuery = useQuery({
    queryKey: ['pubmedMetadata'],
    queryFn: () => fetchPubmedData(),
    refetchInterval: 1000,
    enabled: isFetchingPubmedData.current
  });

  return (
    <Modal isOpen={modalIsOpen} onClose={handleClose} className={styles.evidenceModal} containerClass={styles.evidenceContainer}>
      <div className={styles.top}>
        <h5 className={styles.title}>{evidenceTitle}</h5>
        {
          formattedEvidenceEdges &&
          formattedEvidenceEdges.map((edge, i) => {
            return (
              <h5 className={styles.subtitle} key={i}>{capitalizeAllWords(edge)}</h5>
            )
          })
        }
        {
          <Tabs tabReset={selectedTabToggle}>
            {
              clinicalTrials.current.length > 0 &&
              <div heading="Clinical Trials">
                <div className={`${styles.tableBody} ${styles.clinicalTrials}`}>
                  <div className={`${styles.tableHead}`}>
                    <div className={`${styles.head} ${styles.link}`}>Link</div>
                    <div className={`${styles.head} ${styles.edge}`}>Edge Supported</div>
                  </div>
                  {
                    clinicalTrials.current.map((item, i)=> {
                      return (
                        <div className={styles.evidenceItem} key={i}>
                          <div className={`${styles.cell} ${styles.link} link`}>
                            {item.url && <a href={item.url} rel="noreferrer" target="_blank">{item.url} <ExternalLink/></a>}
                          </div>
                          <span className={`${styles.cell} ${styles.relationship} relationship`}>
                            {
                              item.edge &&
                              <span>
                                <strong>{item.edge.subject}</strong><span className={styles.predicate}>{item.edge.predicates[0]}</span><strong>{item.edge.object}</strong>
                              </span>
                            }
                          </span>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            }
            <div heading="Publications">
              {
                pubmedEvidence.length > 0 &&
                <p className={styles.evidenceCount}>Showing {itemOffset + 1}-{endOffset} of {pubmedEvidence.length} Supporting Evidence</p>
              }
              {
                  <div className={`${itemCountClass.current} ${styles.tableBody}`}>
                    <div className={styles.tableHead}>
                      <div className={`${styles.head} ${styles.relationship}`}>Relationship</div>
                      <div className={`${styles.head} ${styles.date}`}>Date(s)</div>
                      <div
                        className={`${styles.head} ${styles.source} ${isSortedBySource ? styles.true : (isSortedBySource === null) ? '' : styles.false}`}
                        onClick={()=>{handleSort((isSortedBySource)?'sourceHighLow': 'sourceLowHigh')}}
                        >
                        <span className={styles.headSpan}>
                          Source
                        </span>
                      </div>
                      <div
                        className={`${styles.head} ${styles.title} ${isSortedByTitle ? styles.true : (isSortedByTitle === null) ? '' : styles.false}`}
                        onClick={()=>{handleSort((isSortedByTitle)?'titleHighLow': 'titleLowHigh')}}
                        >
                        <span className={styles.headSpan}>
                          Title
                        </span>
                      </div>
                      <div className={`${styles.head} ${styles.abstract}`}>Snippet</div>
                    </div>
                    {
                      isLoading &&
                      <LoadingBar
                        loading={isLoading}
                        useIcon
                        className={styles.loadingBar}
                      />
                    }
                    {
                      !isLoading &&
                      <div className={styles.evidenceItems} >
                        {
                          currentEvidence.length <= 0 &&
                          <p className={styles.noEvidence}>No evidence is currently available for this item.</p>
                        }
                        {
                          displayedPubmedEvidence.length > 0 &&
                          displayedPubmedEvidence.map((item, i)=> {
                            return (
                              <div className={styles.evidenceItem} key={i}>
                                <span className={`${styles.cell} ${styles.relationship} relationship`}>
                                  {
                                    item.edge &&
                                    <span>
                                      <strong>{item.edge.subject}</strong><span className={styles.predicate}>{item.edge.predicates[0]}</span><strong>{item.edge.object}</strong>
                                    </span>
                                  }
                                </span>
                                <span className={`${styles.cell} ${styles.pubdate} pubdate`}>
                                  {item.pubdate && item.pubdate }
                                </span>
                                <span className={`${styles.cell} ${styles.source} source`}>
                                  <span>
                                    {item.source && item.source }
                                  </span>
                                </span>
                                <span className={`${styles.cell} ${styles.title} title`} >
                                  {item.title && item.url && <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a> }
                                  {!item.title && item.url && <a href={item.url} target="_blank" rel="noreferrer">No Title Available</a> }
                                </span>
                                <span className={`${styles.cell} ${styles.abstract} abstract`}>
                                  <span>
                                    {!item.snippet && "No snippet available."}
                                    {item.snippet && item.snippet}
                                  </span>
                                    {item.url && <a href={item.url} className={styles.url} target="_blank" rel="noreferrer">Read More <ExternalLink/></a>}
                                </span>
                              </div>
                            )
                          })
                        }
                      </div>
                    }
                  </div>
              }
              {
                currentEvidence.length > itemsPerPage &&
                <div className={styles.bottom}>
                  <div className={styles.perPage}>
                    <Select
                      label=""
                      name="Items Per Page"
                      size="m"
                      handleChange={(value)=>{
                        setNewItemsPerPage(parseInt(value));
                      }}
                      value={newItemsPerPage}
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
              }
            </div>
            {
              // Add sources modal for predicates
              rawEvidenceEdges &&
              rawEvidenceEdges.provenance.length > 0 &&
              <div heading="Sources">
                <div className={`${styles.tableBody} ${styles.sources}`}>
                  <div className={`${styles.tableHead}`}>
                    <div className={`${styles.head}`}>Relationship</div>
                    <div className={`${styles.head}`}>Source</div>
                    <div className={`${styles.head}`}>Link</div>
                  </div>
                  <div className={styles.evidenceItems}>
                    {
                      rawEvidenceEdges.edges.map((item, i) => { 
                        let subjectName = capitalizeAllWords(item.subject.names[0]);
                        let predicateName = capitalizeAllWords(item.predicate);
                        let objectName = capitalizeAllWords(item.object.names[0]);
                        return(
                          <div className={styles.evidenceItem}>
                            <span className={`${styles.cell} ${styles.relationship} relationship`}>
                              <span className={styles.sourceEdge} key={i}>
                                <span>{subjectName}</span>
                                <strong>{predicateName}</strong>
                                <span>{objectName}</span>
                              </span>
                            </span>
                              {
                                item.provenance.map((provenance, j) => { 
                                  let name = (!Array.isArray(provenance) && typeof provenance === 'object') ? provenance.name: '';
                                  let url = (!Array.isArray(provenance) && typeof provenance === 'object') ? provenance.url: provenance;
                                  return(
                                    <>
                                      { j > 0 &&
                                        <span className={`${styles.cell} ${styles.relationship} relationship`}>
                                          <span className={styles.sourceEdge} key={i}>
                                            <span>{subjectName}</span>
                                            <strong>{predicateName}</strong>
                                            <span>{objectName}</span>
                                          </span>
                                        </span>
                                      }
                                      <span className={`${styles.cell} ${styles.source}`}>
                                        <span className={styles.sourceEdge} key={i}>{name}</span>
                                      </span>
                                      <span className={`${styles.cell} ${styles.link}`}>
                                        <a key={j} href={url} target="_blank" rel="noreferrer" className={styles.edgeProvenanceLink}>
                                          {url}
                                        </a>
                                      </span>
                                    </>
                                  )
                                })
                              }
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              </div>
            }
          </Tabs>
        }
      </div>
    </Modal>
  );
}


export default EvidenceModal;

