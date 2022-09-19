import React, {useState, useEffect} from "react";
import Modal from "./Modal";
import Select from "../FormFields/Select";
import styles from './EvidenceModal.module.scss';
import ReactPaginate from "react-paginate";
import {ReactComponent as ExternalLink} from '../../Icons/external-link.svg';
import { capitalizeAllWords } from "../../Utilities/utilities";

const EvidenceModal = ({isOpen, onClose, currentEvidence, results, title, edges}) => {

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpen = startOpen;

  const [evidenceTitle, setEvidenceTitle] = useState(title ? title : 'All Evidence')
  const [evidenceEdges, setEvidenceEdges] = useState(edges)
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [newItemsPerPage, setNewItemsPerPage] = useState(null);
  const [displayedEvidence, setDisplayedEvidence] = useState([]);
  // Int, number of pages
  const [pageCount, setPageCount] = useState(0);
  // Int, current item offset (ex: on page 3, offset would be 30 based on itemsPerPage of 10)
  const [itemOffset, setItemOffset] = useState(0);
  // Int, current page
  const [currentPage, setCurrentPage] = useState(0);
  const endOffset = (itemOffset + itemsPerPage > currentEvidence.length)
  ? currentEvidence.length
  : itemOffset + itemsPerPage;

  const handleClose = () => {
    onClose();
    setCurrentPage(0);
    setItemOffset(0);
  }

  useEffect(() => {
    setDisplayedEvidence(currentEvidence.slice(itemOffset, endOffset));
    setPageCount(Math.ceil(currentEvidence.length / itemsPerPage));
    if(endOffset !== 0)
      console.log(`Loaded items from ${itemOffset} to ${endOffset}`);
  }, [itemOffset, itemsPerPage, currentEvidence, endOffset]);

  // Handles direct page click
  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerPage) % currentEvidence.length;
    console.log(
      `User requested page number ${event.selected}, which is offset ${newOffset}`
    );
    setCurrentPage(event.selected);
    setItemOffset(newOffset);
  };

  useEffect(() => {
    if(newItemsPerPage !== null) {
      setItemsPerPage(newItemsPerPage);
      setNewItemsPerPage(null);
      handlePageClick({selected: 0});
    }
  }, [newItemsPerPage]);

  useEffect(()=> {
    setEvidenceTitle(title)
  }, [title]);

  useEffect(()=> {
    setEvidenceEdges(edges)
  }, [edges]);
  
  return (
    <Modal isOpen={modalIsOpen} onClose={handleClose} className={styles.evidenceModal} containerClass={styles.evidenceContainer}>
      <h5 className={styles.title}>{evidenceTitle}</h5>
      {
        evidenceEdges && 
        evidenceEdges.map((edge, i) => {
          return (
            <h5 className={styles.subtitle} key={i}>{capitalizeAllWords(edge)}</h5>
          )
        })
      }
      {
        currentEvidence.length > 0 &&
        <p>Showing {itemOffset + 1}-{endOffset} of {currentEvidence.length} Supporting Evidence</p>
      }
      
      <div className={styles.tableBody}>
        <div className={styles.tableHead}>
          <div className={`${styles.head} ${styles.date}`}>Date(s)</div>
          <div className={`${styles.head} ${styles.source}`}>Source</div>
          <div className={`${styles.head} ${styles.title}`}>Title</div>
          <div className={`${styles.head} ${styles.abstract}`}>Snippet</div>
          <div className={`${styles.head} ${styles.relationship}`}>Relationship</div>
          <div className={`${styles.head} ${styles.format}`}>Format</div>
        </div>
        {
          displayedEvidence.length > 0 &&
          displayedEvidence.map((item, i)=> {
            return (
              <div className={styles.evidenceItem} key={i}>
                <span className={`${styles.cell} ${styles.pubdate} pubdate`}>
                  {item.pubdate && item.pubdate }          
                </span>
                <span className={`${styles.cell} ${styles.source} source`}>
                  {item.source && item.source }          
                </span>
                <span className={`${styles.cell} ${styles.title} title`}>
                  {item.title && item.url && <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a> }
                  {item.url && <a href={item.url} target="_blank" rel="noreferrer">No Title Available</a> }
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
                      <span className={styles.bold}>{item.edge.subject}</span> {item.edge.predicate} <span className={styles.bold}>{item.edge.object}</span>
                    </span>
                  }          
                </span>
                <span className={`${styles.cell} format`}>
                  {item.format && item.format }          
                </span>
              </div>
            )
          })
        } 
        {
          currentEvidence.length <= 0 &&
          <p className={styles.noEvidence}>No evidence is currently available for this item.</p>
        }
      </div>
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
    </Modal>
  );
}


export default EvidenceModal;

