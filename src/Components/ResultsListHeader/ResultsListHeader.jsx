import styles from './ResultsListHeader.module.scss';
import ReactPaginate from 'react-paginate';
import SelectedFilterTag from '../SelectedFilterTag/SelectedFilterTag';
import ChevLeft from '../../Icons/Directional/Chevron/Chevron Left.svg?react';
import ChevRight from '../../Icons/Directional/Chevron/Chevron Right.svg?react';
import FilterIcon from '../../Icons/Navigation/Filter.svg?react';
import Button from '../Core/Button';

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
          pageRangeDisplayed={4}
          marginPagesDisplayed={1}
          pageCount={data.pageCount}
          renderOnZeroPageCount={null}
          className={`pageNums ${data.resultsListStyles.pageNums}`}
          pageClassName='pageNum'
          activeClassName='current'
          previousLinkClassName={`button ${data.resultsListStyles.button}`}
          nextLinkClassName={`button ${data.resultsListStyles.button}`}
          disabledLinkClassName={`disabled ${data.resultsListStyles.disabled}`}
          forcePage={data.currentPage}
        />
      </div>
      <div className={styles.activeFilters}>
        {
          !data.filtersExpanded &&
          <Button isSecondary handleClick={data.setFiltersExpanded} className={styles.filterButton}><FilterIcon/>Filters</Button>
        }
        {
          data.activeFilters.length > 0 &&
          data.activeFilters.map((activeFilter, i)=> {
            return(
              <SelectedFilterTag filter={activeFilter} handleFilter={data.handleFilter}/>
            )
          })
        }
      </div>
    </div>
  )
}

export default ResultsListHeader;
