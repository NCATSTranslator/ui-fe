import React, {useState, useEffect, useCallback, useRef} from "react";
import Modal from "./Modal";
import Tabs from "../Tabs/Tabs";
import Select from "../FormFields/Select";
import LoadingBar from "../LoadingBar/LoadingBar";
import styles from './EvidenceModal.module.scss';
import ReactPaginate from "react-paginate";
import { Fade } from "react-awesome-reveal";
import {ReactComponent as ExternalLink} from '../../Icons/external-link.svg';
import { capitalizeAllWords } from "../../Utilities/utilities";
import { cloneDeep } from "lodash";
import { useQuery } from "react-query";

const EvidenceModal = ({isOpen, onClose, currentEvidence, results, title, edges}) => {

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpen = startOpen;

  const [pubmedEvidence, setPubmedEvidence] = useState([]);
  const clinicalTrials = useRef([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingPubmedData, setIsFetchingPubmedData] = useState(false);
  const fetchedPubmedData = useRef(false);
  const [evidenceTitle, setEvidenceTitle] = useState(title ? title : 'All Evidence')
  const [evidenceEdges, setEvidenceEdges] = useState(edges)
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const itemCountClass = useRef(styles.five);
  const [newItemsPerPage, setNewItemsPerPage] = useState(null);
  const [displayedPubmedEvidence, setDisplayedPubmedEvidence] = useState([]);
  // Int, number of pages
  const [pageCount, setPageCount] = useState(0);
  // Int, current item offset (ex: on page 3, offset would be 30 based on itemsPerPage of 10)
  const [itemOffset, setItemOffset] = useState(0);
  // Int, current page
  const [currentPage, setCurrentPage] = useState(0);
  const endOffset = (itemOffset + itemsPerPage > pubmedEvidence.length)
  ? pubmedEvidence.length
  : itemOffset + itemsPerPage;

  const handleClose = () => {
    onClose();
    setCurrentPage(0);
    setItemOffset(0);
    // setIsLoading(true);
  }

  useEffect(() => {
    setEvidenceTitle(title)
  }, [title]);

  useEffect(() => {
    setEvidenceEdges(edges)
  }, [edges]);

  useEffect(() => {
    setDisplayedPubmedEvidence(pubmedEvidence.slice(itemOffset, endOffset));
    setPageCount(Math.ceil(pubmedEvidence.length / itemsPerPage));
  }, [itemOffset, itemsPerPage, pubmedEvidence, endOffset]);

  useEffect(() => {
    if(!fetchedPubmedData.current && displayedPubmedEvidence.length > 0) {
      for(const item of displayedPubmedEvidence) {
        if(!item.updated) {
          setIsFetchingPubmedData(true);
          setIsLoading(true);
          break;
        } 
      }
    }
    if(fetchedPubmedData.current && displayedPubmedEvidence.length > 0)
      fetchedPubmedData.current = false;
  }, [displayedPubmedEvidence]);

  useEffect(() => {
    setPubmedEvidence(cloneDeep(currentEvidence).filter(item => item.type === 'PMID'));
    clinicalTrials.current = cloneDeep(currentEvidence).filter(item => item.type === 'NCT');
  }, [currentEvidence])

  // Handles direct page click
  const handlePageClick = useCallback((event) => {
    const newOffset = (event.selected * itemsPerPage) % pubmedEvidence.length;
    setCurrentPage(event.selected);
    setItemOffset(newOffset);
  },[itemsPerPage, pubmedEvidence]);

  const insertAdditionalPubmedData = useCallback((data) => {

    let newPubmedEvidence = cloneDeep(pubmedEvidence)
    for(const element of newPubmedEvidence) {
      if(data[element.id] !== undefined) {
        if(!element.source)
          element.source = capitalizeAllWords(data[element.id].journal_name);
        if(!element.title)
          element.title = capitalizeAllWords(data[element.id].article_title);
        if(!element.snippet)
          element.snippet = data[element.id].abstract;
        if(!element.pubdate) {
          let year = (data[element.id].pub_year) ? data[element.id].pub_year: '';
          let month = (data[element.id].pub_month !== '-') ? data[element.id].pub_month: '';
          let day = (data[element.id].pub_day) ? data[element.id].pub_day: '';
          element.pubdate = `${year} ${month} ${day}`;
        }

        element.updated = true;
      }
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

  // useEffect(() => {
  //   if(!isLoading || !isOpen) 
  //     return;

  //   let timeout = 1000;
  //   const timer = setTimeout(() => {
  //     setIsLoading(false);
  //   }, timeout);
  //   return () => clearTimeout(timer);
  // }, [isLoading, isOpen])

  // useEffect(() => {
  //   if(!isOpen || displayedPubmedEvidence.length === 0)
  //     return;

  //   setIsFetchingPubmedData(true);
  // }, [isOpen, displayedPubmedEvidence]);

  useEffect(()=> {
    if(fetchedPubmedData.current)
      setIsLoading(false);
  }, [pubmedEvidence])

  // eslint-disable-next-line
  const pubMedMetadataQuery = useQuery('pubmedMetadata', async () => {

    if(!pubmedEvidence)
      return;

    const PMIDs = displayedPubmedEvidence.map(item => item.id).join(',');
    if(PMIDs.length <= 0)
      return;
    // console.log("Fetching new pubmed data...");
    // console.log(`https://e2ewfsmmxz.us-east-1.awsapprunner.com/publications?pubids=${PMIDs}&request_id=26394fad-bfd9-4e32-bb90-ef9d5044f593`);
    // eslint-disable-next-line
    const response = await fetch(`https://e2ewfsmmxz.us-east-1.awsapprunner.com/publications?pubids=${PMIDs}&request_id=26394fad-bfd9-4e32-bb90-ef9d5044f593`)
      .then(response => response.json())
      .then(data => {
        // console.log('New pubmed data:', data);
        setIsFetchingPubmedData(false);
        fetchedPubmedData.current = true;
        // adjust this later to save additional evidence and prevent unnecessarily repetitious api calls 
        setPubmedEvidence(insertAdditionalPubmedData(data.results));
      })
      .catch((error) => {
        console.log(error)
      });
  }, { 
    enabled: isFetchingPubmedData,
    refetchOnWindowFocus: false
  });
  
  return (
    <Modal isOpen={modalIsOpen} onClose={handleClose} className={styles.evidenceModal} containerClass={styles.evidenceContainer}>
      <div className={styles.top}>
        <h5 className={styles.title}>{evidenceTitle}</h5>
        {
          evidenceEdges && 
          evidenceEdges.map((edge, i) => {
            return (
              <h5 className={styles.subtitle} key={i}>{capitalizeAllWords(edge)}</h5>
            )
          })
        }
        {/* {
          isLoading &&
          <LoadingBar 
            loading={isLoading}
            useIcon
          />
        } */}
        {
            <Tabs>
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
                                  <strong>{item.edge.subject}</strong> {item.edge.predicate} <strong>{item.edge.object}</strong>
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
                        <div className={`${styles.head} ${styles.date}`}>Date(s)</div>
                        <div className={`${styles.head} ${styles.source}`}>Source</div>
                        <div className={`${styles.head} ${styles.title}`}>Title</div>
                        <div className={`${styles.head} ${styles.abstract}`}>Snippet</div>
                        <div className={`${styles.head} ${styles.relationship}`}>Relationship</div>
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
                        <Fade className={styles.evidenceItems} duration={500} triggerOnce >
                          <>
                            {
                              currentEvidence.length <= 0 &&
                              <p className={styles.noEvidence}>No evidence is currently available for this item.</p>
                            }
                            {
                              displayedPubmedEvidence.length > 0 &&
                              displayedPubmedEvidence.map((item, i)=> {
                                return (
                                  <div className={styles.evidenceItem} key={i}>
                                    <span className={`${styles.cell} ${styles.pubdate} pubdate`}>
                                      {item.pubdate && item.pubdate }          
                                    </span>
                                    <span className={`${styles.cell} ${styles.source} source`}>
                                      <span>
                                        {item.source && item.source }
                                      </span>     
                                    </span>
                                    <span className={`${styles.cell} ${styles.title} title`}>
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
                                    <span className={`${styles.cell} ${styles.relationship} relationship`}>
                                      {
                                        item.edge && 
                                        <span>
                                          <strong>{item.edge.subject}</strong> {item.edge.predicate} <strong>{item.edge.object}</strong>
                                        </span>
                                      }          
                                    </span>
                                  </div>
                                )
                              })
                            } 
                          </>
                        </Fade>
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
              {/* <div heading="P Value">
                <div className={`${styles.tableBody} ${styles.pValueTable}`}>
                  <div className={`${styles.tableHead}`}>
                    <div className={`${styles.head} ${styles.link}`}>P Value</div>
                    <div className={`${styles.head} ${styles.edge}`}>Edge Supported</div>
                  </div>
                  <div className={styles.evidenceItem}>
                    <div className={`${styles.cell} ${styles.pValue} pvalue`}>1</div>
                    <div className={`${styles.cell} ${styles.edge}`}><strong>Example node</strong> example edge <strong>example node</strong></div>
                  </div>
                </div>
              </div>
              <div heading="Other">
                <div className={`${styles.tableBody} ${styles.otherTable}`}>
                  <div className={`${styles.tableHead}`}>
                    <div className={`${styles.head} ${styles.link}`}>Link</div>
                    <div className={`${styles.head} ${styles.edge}`}>Edge Supported</div>
                  </div>
                  <div className={styles.evidenceItem}>
                    <div className={`${styles.cell} ${styles.link} link`}><a href="https://lincsproject.org/" target="_blank" rel="noreferrer">lincsproject.org</a></div>
                    <div className={`${styles.cell} ${styles.edge}`}><strong>Example node</strong> example edge <strong>example node</strong></div>
                  </div>
                </div>
              </div> */}
            </Tabs>
        }
      </div>

      
    </Modal>
  );
}


export default EvidenceModal;

