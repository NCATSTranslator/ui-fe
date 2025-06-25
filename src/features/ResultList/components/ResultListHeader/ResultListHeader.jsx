import styles from './ResultListHeader.module.scss';
import ReactPaginate from 'react-paginate';
import SelectedFilterTag from '@/features/ResultFiltering/components/SelectedFilterTag/SelectedFilterTag';
import ChevLeft from '@/assets/icons/Directional/Chevron/Chevron Left.svg?react';
import ChevRight from '@/assets/icons/Directional/Chevron/Chevron Right.svg?react';
import FilterIcon from '@/assets/icons/Navigation/Filter.svg?react';
import Button from '@/features/Common/components/Button/Button';

const ResultListHeader = ({ data }) => {

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
          className={`pageNums ${data.ResultListStyles.pageNums}`}
          pageClassName='pageNum'
          activeClassName='current'
          previousLinkClassName={`button ${data.ResultListStyles.button}`}
          nextLinkClassName={`button ${data.ResultListStyles.button}`}
          disabledLinkClassName={`disabled ${data.ResultListStyles.disabled}`}
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

export default ResultListHeader;
