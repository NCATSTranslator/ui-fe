import { FC } from 'react';
import { useSelector } from 'react-redux';
import { currentConfig }from "@/features/UserAuth/slices/userSlice";
import styles from './ResultListHeader.module.scss';
import ReactPaginate from 'react-paginate';
import SelectedFilterTag from '@/features/ResultFiltering/components/SelectedFilterTag/SelectedFilterTag';
import Toggle from '@/features/Core/components/Toggle/Toggle';
import ChevLeft from '@/assets/icons/directional/Chevron/Chevron Left.svg?react';
import ChevRight from '@/assets/icons/directional/Chevron/Chevron Right.svg?react';
import { useResultListContext } from '@/features/ResultList/context/ResultListContext';

interface ResultListHeaderData {
  formattedResultsLength: number;
  originalResultsLength: number;
  itemOffset: number;
  endResultIndex: number;
  currentPage: number;
  ResultListStyles: { [key: string]: string };
  pageCount: number;
  handlePageClick: (event: { selected: number }) => void;
  noveltyBoost: boolean;
  onToggleNoveltyBoost: (active: boolean) => void;
}

interface ResultListHeaderProps {
  data: ResultListHeaderData;
}

const ResultListHeader: FC<ResultListHeaderProps> = ({ data }) => {

  const config = useSelector(currentConfig);
  const showNoveltyBoost = config?.show_novelty_boost;
  const { activeFilters, handleFilter } = useResultListContext();

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
        <div className={styles.controls}>
          {
            showNoveltyBoost &&
            <Toggle
              className={styles.noveltyToggle}
              active={data.noveltyBoost}
              setActive={data.onToggleNoveltyBoost}
              labelOne="Default"
              labelTwo="Novelty"
            />
          }
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
      </div>
      <div className={styles.activeFilters}>
        {
          activeFilters.length > 0 &&
          activeFilters.map((activeFilter, i)=> {
            return(
              <SelectedFilterTag key={activeFilter?.id || i.toString()} filter={activeFilter} handleFilter={handleFilter}/>
            )
          })
        }
      </div>
    </div>
  )
}

export default ResultListHeader;
