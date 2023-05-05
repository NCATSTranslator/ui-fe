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

const EvidenceModal = ({isOpen, onClose, currentEvidence, item, isAll, edgeGroup}) => {

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpen = startOpen;

  const [pubmedEvidence, setPubmedEvidence] = useState([]);
  const [sources, setSources] = useState([]);
  const clinicalTrials = useRef([]);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState({});
  const [formattedEdges, setFormattedEdges] = useState(null)
  const [itemsPerPage, setItemsPerPage] = useState(5);
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
    amountOfIDsProcessed.current = 0;
    evidenceToUpdate.current = null;
    fetchedPubmedData.current = false;
  }

  useEffect(() => {
    setSelectedItem(item);
  }, [item])

  useEffect(() => {
    if(!Array.isArray(edgeGroup) && typeof edgeGroup === 'object') {
      const re = edgeGroup.edges[0];
      const formatted = edgeGroup.predicates.map((p) => {
        return `${re.subject.names[0].toLowerCase()} ${p.toLowerCase()} ${re.object.names[0].toLowerCase()}`;
      });
      setFormattedEdges(formatted);
    } else {
      setFormattedEdges(null);
    }
  }, [edgeGroup]);

  useEffect(() => {
    setDisplayedPubmedEvidence(pubmedEvidence.slice(itemOffset, endOffset));
    setPageCount(Math.ceil(pubmedEvidence.length / itemsPerPage));
  }, [itemOffset, itemsPerPage, pubmedEvidence, endOffset]);

  useEffect(() => {
    if(isOpen) {
      setPubmedEvidence(cloneDeep(currentEvidence.publications.filter(item => item.type === 'PMID' || item.type === 'PMC')));
      clinicalTrials.current = cloneDeep(currentEvidence.publications.filter(item => item.type === 'NCT'));
      let displayedSources = currentEvidence.sources; 
      if (isAll) {
        displayedSources = currentEvidence.distinctSources;
      }

      setSources(displayedSources);
    }
  }, [currentEvidence, isOpen, isAll])

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
        <h5 className={styles.title}>{ isAll ? `All Evidence for ${selectedItem.name}` : 'Showing Evidence for:'}</h5>
        {
          !isAll &&
          formattedEdges &&
          formattedEdges.map((edge, i) => {
            return (
              <h5 className={styles.subtitle} key={i}>{capitalizeAllWords(edge)}</h5>
            )
          })
        }
        {
          <Tabs isOpen={modalIsOpen}>
            {
              clinicalTrials.current.length > 0 &&
              <div heading="Clinical Trials">
                <div className={`${styles.tableBody} ${styles.clinicalTrials}`}>
                  <div className={`${styles.tableHead}`}>
                    <div className={`${styles.head} ${styles.edge}`}>Edge Supported</div>
                    <div className={`${styles.head} ${styles.link}`}>Link</div>
                  </div>
                  <div className={styles.evidenceItems}>
                    {
                      clinicalTrials.current.map((item, i)=> {
                        return (
                          <div className={styles.evidenceItem} key={i}>
                            <span className={`${styles.cell} ${styles.relationship} relationship`}>
                              {
                                item.edge &&
                                <span>
                                  <span>{item.edge.subject}</span><strong>{item.edge.predicates[0]}</strong><span>{item.edge.object}</span>
                                </span>
                              }
                            </span>
                            <div className={`${styles.cell} ${styles.link} link`}>
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
              pubmedEvidence.length > 0 &&
              <div heading="Publications">
                <p className={styles.evidenceCount}>Showing {itemOffset + 1}-{endOffset} of {pubmedEvidence.length} Supporting Evidence</p>
                {
                  <div className={`${styles.tableBody}`}>
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
                          displayedPubmedEvidence.map((item, i)=> {
                            return (
                              <div className={styles.evidenceItem} key={i}>
                                <span className={`${styles.cell} ${styles.relationship} relationship`}>
                                  {
                                    item.edge &&
                                    <span>
                                      <span>{item.edge.subject}</span><strong>{item.edge.predicates[0]}</strong><span>{item.edge.object}</span>
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
                  pubmedEvidence.length > itemsPerPage &&
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
            }
            {
              // Add sources modal for predicates
              sources.length > 0 &&
              <div heading="Sources">
                <div className={`${styles.tableBody} ${isAll ? styles.distinctSources : styles.sources}`}>
                  <div className={`${styles.tableHead}`}>
                    { !isAll && <div className={`${styles.head}`}>Relationship</div> }
                    <div className={`${styles.head}`}>Source</div>
                    <div className={`${styles.head}`}>Link</div>
                  </div>
                  <div className={styles.evidenceItems}>
                    {
                      sources.map((src, i) => { 
                        let subjectName = capitalizeAllWords(src.edge.subject);
                        let predicateName = capitalizeAllWords(src.edge.predicates[0]);
                        let objectName = capitalizeAllWords(src.edge.object);
                        let name = (!Array.isArray(src) && typeof src === 'object') ? src.name: '';
                        let url = (!Array.isArray(src) && typeof src === 'object') ? src.url: src;
                        return(
                          <div className={styles.evidenceItem}>
                            { !isAll &&
                              <span className={`${styles.cell} ${styles.relationship} relationship`}>
                                <span className={styles.sourceEdge} key={i}>
                                  <span>{subjectName}</span>
                                  <strong>{predicateName}</strong>
                                  <span>{objectName}</span>
                                </span>
                              </span>
                            }
                            <span className={`${styles.cell} ${styles.source} ${styles.sourceItem}`}>
                              <span className={styles.sourceEdge} key={i}>{name}</span>
                            </span>
                            <span className={`${styles.cell} ${styles.link} ${styles.sourceItem}`}>
                              <a key={i} href={url} target="_blank" rel="noreferrer" className={styles.edgeProvenanceLink}>
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
        }
      </div>
    </Modal>
  );
}


export default EvidenceModal;