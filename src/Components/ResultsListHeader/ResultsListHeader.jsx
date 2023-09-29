import styles from './ResultsListHeader.module.scss';
import ResultsListLoadingButton from '../ResultsListLoadingButton/ResultsListLoadingButton';
import ShareModal from "../Modals/ShareModal"; 
import { isFacet, isEvidenceFilter, isTextFilter, isFdaFilter } from '../../Utilities/filterFunctions';
import CloseIcon from '../../Icons/Buttons/Close.svg?react'
import ShareIcon from '../../Icons/share.svg?react';

  // Output jsx for selected filters
const getSelectedFilterDisplay = (filter) => {
  let filterDisplay;
  if (isEvidenceFilter(filter)) {
    filterDisplay = <div>Minimum Evidence: <span>{filter.value}</span></div>;
  } else if (isTextFilter(filter)) {
    filterDisplay = <div>String: <span>{filter.value}</span></div>;
  } else if (isFdaFilter(filter)) {
    filterDisplay = <div><span>FDA Approved</span></div>;
  } else if (isFacet(filter)) {
    filterDisplay = <div>Tag:<span> {filter.value}</span></div>;
  }

  return filterDisplay;
}

const ResultsListHeader = ({ data, loadingButtonData }) => {

  return(
    <div className={styles.resultsHeader}>
      <div className={styles.top}>
        <div>
          <h5>Results</h5>
          {
            data.formattedResultsLength !== 0 &&
            <p className={styles.resultsCount}>
              Showing <span className={styles.range}>
                <span className={styles.start}>{data.itemOffset + 1}</span>
                -
                <span>{data.endResultIndex}</span>
              </span> of
              <span className={styles.count}> {data.formattedResultsLength} </span>
              {
                (data.formattedResultsLength !== data.originalResultsLength) &&
                <span className={styles.total}>({data.originalResultsLength}) </span>
              }
              <span> Results</span>
            </p>
          }
        </div>
        <div className={styles.right}>
          <ResultsListLoadingButton
            data={{
              handleResultsRefresh: loadingButtonData.handleResultsRefresh,
              isFetchingARAStatus: loadingButtonData.isFetchingARAStatus,
              isFetchingResults: loadingButtonData.isFetchingResults,
              showDisclaimer: loadingButtonData.showDisclaimer,
              containerClassName: loadingButtonData.containerClassName,
              buttonClassName: loadingButtonData.buttonClassName,
              hasFreshResults: loadingButtonData.hasFreshResults
            }}
          />
          <button
            className={styles.shareButton}
            onClick={()=>{data.setShareModalOpen(true)}}
            data-testid="share-button"
            >
              <ShareIcon/>
          </button>
          <ShareModal
            isOpen={data.shareModalOpen}
            onClose={()=>data.setShareModalOpen(false)}
            qid={data.currentQueryID}
          />
        </div>
      </div>
      {
        data.activeFilters.length > 0 &&
        <div className={styles.activeFilters}>
          {
            data.activeFilters.map((activeFilter, i)=> {
              return(
                <span key={i} className={`${styles.filterTag} ${activeFilter.type}`}>
                  { getSelectedFilterDisplay(activeFilter) }
                  <span className={styles.close} onClick={()=>{data.handleFilter(activeFilter)}}><CloseIcon/></span>
                </span>
              )
            })
          }
        </div>
      }
    </div>
  )
}

export default ResultsListHeader;