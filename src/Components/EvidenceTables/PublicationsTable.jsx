import ExternalLink from '../../Icons/external-link.svg?react';
import LoadingBar from "../LoadingBar/LoadingBar";
import styles from './PublicationsTable.module.scss';
import Select from '../FormFields/Select';
import ReactPaginate from "react-paginate";

const PublicationsTable = ({ pubmedEvidence, pageData, displayedPubmedEvidence, eventHandlers,
   sortingSetters, sortingStates, isLoading, item }) => {

  return(
    <>
      <p className={styles.evidenceCount}>Showing {pageData.itemOffset + 1}-{pageData.endOffset} of {pubmedEvidence.length} Publications</p>
      <div className={styles.knowledgeType}>
        <button onClick={()=>eventHandlers.handleEvidenceSort('textMined')}>Text Mined</button>
        <button onClick={()=>eventHandlers.handleEvidenceSort('curated')}>Curated</button>
      </div>
      <div className={`table-body ${styles.pubsTable}`}>
        <div className={`table-head`}>
          <div className={`head ${styles.knowledgeLevel}`}>Knowledge Level</div>
          <div 
            className={`head ${styles.pubdate} ${sortingStates.isSortedByDate ? 'true' : (sortingStates.isSortedByDate === null) ? '' : 'false'}`}
            onClick={()=>{eventHandlers.handleEvidenceSort((sortingStates.isSortedByDate) ? 'dateLowHigh': 'dateHighLow', pubmedEvidence, eventHandlers.handlePageClick, sortingSetters)}}
            >
            <span className={`head-span`}>
              Date(s)
            </span>
          </div>
          <div
            className={`head ${styles.source} ${sortingStates.isSortedBySource ? 'true' : (sortingStates.isSortedBySource === null) ? '' : 'false'}`}
            onClick={()=>{eventHandlers.handleEvidenceSort((sortingStates.isSortedBySource) ? 'sourceHighLow': 'sourceLowHigh', pubmedEvidence, eventHandlers.handlePageClick, sortingSetters)}}
            >
            <span className={`head-span`}>
              Journal
            </span>
          </div>
          <div
            className={`head ${styles.title} ${sortingStates.isSortedByTitle ? 'true' : (sortingStates.isSortedByTitle === null) ? '' : 'false'}`}
            onClick={()=>{eventHandlers.handleEvidenceSort((sortingStates.isSortedByTitle) ? 'titleHighLow': 'titleLowHigh', pubmedEvidence, eventHandlers.handlePageClick, sortingSetters)}}
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
              eventHandlers.setItemsPerPage(parseInt(value));
              eventHandlers.handlePageClick({selected: 0});
            }}
            value={pageData.itemsPerPage}
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
            onPageChange={eventHandlers.handlePageClick}
            pageRangeDisplayed={2}
            marginPagesDisplayed={2}
            pageCount={pageData.pageCount}
            renderOnZeroPageCount={null}
            className={styles.pageNums}
            pageClassName={styles.pageNum}
            activeClassName={styles.current}
            previousLinkClassName={`${styles.prev} ${styles.button}`}
            nextLinkClassName={`${styles.prev} ${styles.button}`}
            disabledLinkClassName={styles.disabled}
            forcePage={pageData.currentPage}
          />
        </div>
      </div>
    </>
  )
}

export default PublicationsTable;