import styles from './ResultsListHeader.module.scss';
import ReactPaginate from 'react-paginate';
import { isFacet, isEvidenceFilter, isTextFilter, isFdaFilter, getFilterLabel } from '../../Utilities/filterFunctions';
import CloseIcon from '../../Icons/Buttons/Close/Close.svg?react'
import ChevLeft from '../../Icons/Directional/Chevron/Chevron Left.svg?react';
import ChevRight from '../../Icons/Directional/Chevron/Chevron Right.svg?react';

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

const ResultsListHeader = ({ data }) => {

  return(
    <div className={styles.resultsHeader}>
      <div className={styles.top}>
        <div>
          <h4 className={styles.heading}>Results</h4>
          {
            data.formattedResultsLength !== 0 &&
            <p className={styles.resultsCount}>
              Showing <span className={styles.range}>
                <span className={styles.start}>{data.itemOffset + 1}</span>
                -
                <span>{data.endResultIndex > data.formattedResultsLength ? data.formattedResultsLength : data.endResultIndex}</span>
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
        <ReactPaginate
          breakLabel="..."
          nextLabel={<ChevRight/>}
          previousLabel={<ChevLeft/>}
          onPageChange={data.handlePageClick}
          pageRangeDisplayed={5}
          marginPagesDisplayed={1}
          pageCount={data.pageCount}
          renderOnZeroPageCount={null}
          className={data.resultsListStyles.pageNums}
          pageClassName={data.resultsListStyles.pageNum}
          activeClassName={data.resultsListStyles.current}
          previousLinkClassName={`${data.resultsListStyles.button}`}
          nextLinkClassName={`${data.resultsListStyles.button}`}
          disabledLinkClassName={data.resultsListStyles.disabled}
          forcePage={data.currentPage}
        />
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
