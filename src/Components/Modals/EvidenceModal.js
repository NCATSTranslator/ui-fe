import React, {useState, useEffect} from "react";
import Modal from "./Modal";
import styles from './EvidenceModal.module.scss';
import ReactPaginate from "react-paginate";

const EvidenceModal = ({isOpen, onClose, currentEvidence, results}) => {

  const startOpen = (isOpen === undefined) ? false : isOpen;
  var modalIsOpen = startOpen;
  
  // eslint-disable-next-line
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [displayedEvidence, setDisplayedEvidence] = useState([]);
  // Int, number of pages
  const [pageCount, setPageCount] = useState(0);
  // Int, current item offset (ex: on page 3, offset would be 30 based on itemsPerPage of 10)
  const [itemOffset, setItemOffset] = useState(0);
  const endOffset = (itemOffset + itemsPerPage > currentEvidence.length)
  ? currentEvidence.length
  : itemOffset + itemsPerPage;

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
    setItemOffset(newOffset);
  };
  
  return (
    <Modal isOpen={modalIsOpen} onClose={onClose} className={styles.evidenceModal} containerClass={styles.evidenceContainer}>
      <h5>All Evidence</h5>
      <p>Showing {itemOffset + 1}-{endOffset} of {currentEvidence.length} Supporting Evidence</p>
      <div className={styles.tableBody}>
        <div className={styles.tableHead}>
          <div className={`${styles.head} ${styles.date}`}>Date(s)</div>
          <div className={`${styles.head} ${styles.source}`}>Source</div>
          <div className={`${styles.head} ${styles.title}`}>Title</div>
          <div className={`${styles.head} ${styles.abstract}`}>Abstract</div>
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
                    {!item.snippet && "No abstract available."}
                    {item.snippet && item.snippet}
                  </span>
                    {item.url && <a href={item.url} className={styles.url} target="_blank" rel="noreferrer">Read More</a>}          
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
          <p>No evidence is currently available for this item.</p>
        }
      </div>
      { 
      currentEvidence.length > itemsPerPage && 
      <div className={styles.pagination}>
        <ReactPaginate
          breakLabel="..."
          nextLabel="Next"
          previousLabel="Previous"
          onPageChange={handlePageClick}
          pageRangeDisplayed={5}
          marginPagesDisplayed={1}
          pageCount={pageCount}
          renderOnZeroPageCount={null}
          className={styles.pageNums}
          pageClassName={styles.pageNum}
          activeClassName={styles.current}
          previousLinkClassName={`${styles.prev} ${styles.button}`}
          nextLinkClassName={`${styles.prev} ${styles.button}`}
          disabledLinkClassName={styles.disabled}
        />
      </div>
      }
    </Modal>
  );
}


export default EvidenceModal;

