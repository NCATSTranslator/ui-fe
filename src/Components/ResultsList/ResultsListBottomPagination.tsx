import { Dispatch, SetStateAction, FC } from "react";
import Select from "../Core/Select";
import ReactPaginate from 'react-paginate';
import ChevLeft from '../../Icons/Directional/Chevron/Chevron Left.svg?react';
import ChevRight from '../../Icons/Directional/Chevron/Chevron Right.svg?react';

interface ResultsListBottomPaginationProps {
  parentStyles: {[key: string]: string};
  itemsPerPage: number;
  setItemsPerPage: Dispatch<SetStateAction<number>>;
  handlePageReset: (newItemsPerPage: number, resultsLength: number) => void;
  handlePageClick: (event: { selected: number}, newItemsPerPage?: number | false, resultsLength?: number, currentNumItemsPerPage?: number) => void;
  formattedResultsLength: number;
  pageCount: number;
  currentPage: number;
}

const ResultsListBottomPagination: FC<ResultsListBottomPaginationProps> = ({ 
  parentStyles, 
  itemsPerPage, 
  setItemsPerPage, 
  handlePageReset, 
  handlePageClick, 
  formattedResultsLength, 
  pageCount, 
  currentPage }) => {

  return(
    <div className={parentStyles.pagination}>
      <div className={parentStyles.perPageContainer}>
        <p className="caption">Results per Page</p>
        <Select
          label=""
          name="Results Per Page"
          handleChange={(value)=>{
            let newVal = (typeof value === 'string') ? parseInt(value) : value; 
            setItemsPerPage(newVal);
            handlePageReset(newVal, formattedResultsLength);
          }}
          noanimate
          className={parentStyles.perPage}
          value={itemsPerPage}
          >
          <option value="5" key="0">5</option>
          <option value="10" key="1">10</option>
          <option value="20" key="2">20</option>
          <option value="50" key="3">50</option>
        </Select>
      </div>
      <ReactPaginate
        breakLabel="..."
        nextLabel={<ChevRight/>}
        previousLabel={<ChevLeft/>}
        onPageChange={handlePageClick}
        pageRangeDisplayed={4}
        marginPagesDisplayed={1}
        pageCount={pageCount}
        renderOnZeroPageCount={null}
        className={`pageNums ${parentStyles.pageNums}`}
        pageClassName='pageNum'
        activeClassName='current'
        previousLinkClassName={`button ${parentStyles.button}`}
        nextLinkClassName={`button ${parentStyles.button}`}
        disabledLinkClassName={`disabled ${parentStyles.disabled}`}
        forcePage={currentPage}
      />
    </div>
  )
}

export default ResultsListBottomPagination;