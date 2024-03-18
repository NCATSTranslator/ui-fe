import styles from './ResultsListHeader.module.scss';
import ResultsListLoadingButton from '../ResultsListLoadingButton/ResultsListLoadingButton';
import ResultsListLoadingBar from '../ResultsListLoadingBar/ResultsListLoadingBar';
import ShareModal from "../Modals/ShareModal";
import Tooltip from '../Tooltip/Tooltip';
import { isFacet, isEvidenceFilter, isTextFilter, isFdaFilter, getFilterLabel } from '../../Utilities/filterFunctions';
import CloseIcon from '../../Icons/Buttons/Close.svg?react'
import ShareIcon from '../../Icons/share.svg?react';

  // Output jsx for selected filters
const getSelectedFilterDisplay = (filter) => {
  let filterDisplay;
  if (isEvidenceFilter(filter)) {
    filterDisplay = <div>Minimum Evidence: <span>{filter.value}</span></div>;
  } else if (isTextFilter(filter)) {
    filterDisplay = <div>Text Filter: <span>{filter.value}</span></div>;
  } else if (isFdaFilter(filter)) {
    filterDisplay = <div><span>FDA Approved</span></div>;
  } else if (isFacet(filter)) {
    let filterLabel = getFilterLabel(filter);
    filterDisplay = <div>{filterLabel}:<span> {filter.value}</span></div>;
  }

  return filterDisplay;
}

const ResultsListHeader = ({ data, loadingButtonData }) => {

  return(
    <div className={styles.resultsHeader}>
      <div className={styles.top}>
        <div>
          <h5 className={styles.heading}>Results</h5>
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
        <div className={styles.middle}>
          <ResultsListLoadingBar
            data={{
              handleResultsRefresh: loadingButtonData.handleResultsRefresh,
              isFetchingARAStatus: loadingButtonData.isFetchingARAStatus,
              isFetchingResults: loadingButtonData.isFetchingResults,
              showDisclaimer: loadingButtonData.showDisclaimer,
              containerClassName: loadingButtonData.containerClassName,
              buttonClassName: loadingButtonData.buttonClassName,
              hasFreshResults: loadingButtonData.hasFreshResults,
              currentInterval: data.returnedARAs.status === "success" ? 100 : data.returnedARAs.aras.length,
              status: data.returnedARAs.status
            }}
          />
        </div>
        <div className={styles.right}>
          {/* <ResultsListLoadingButton
            data={{
              handleResultsRefresh: loadingButtonData.handleResultsRefresh,
              isFetchingARAStatus: loadingButtonData.isFetchingARAStatus,
              isFetchingResults: loadingButtonData.isFetchingResults,
              showDisclaimer: loadingButtonData.showDisclaimer,
              containerClassName: loadingButtonData.containerClassName,
              buttonClassName: loadingButtonData.buttonClassName,
              hasFreshResults: loadingButtonData.hasFreshResults
            }}
          /> */}
          <button
            className={styles.shareButton}
            onClick={()=>{data.setShareModalOpen(true)}}
            data-testid="share-button"
            data-tooltip-id={`share-button-results-header`}
            aria-describedby={`share-button-results-header`}
            >
              <ShareIcon/>
              <Tooltip id={`share-button-results-header`}>
                <span className={styles.tooltip}>Generate a sharable link for this set of results.</span>
              </Tooltip>
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
                <span key={i} className={`${styles.filterTag} ${activeFilter.type} ${activeFilter?.negated ? styles.negated : ''}`}>
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
