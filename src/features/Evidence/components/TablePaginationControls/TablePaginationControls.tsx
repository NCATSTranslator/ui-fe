import { FC } from "react";
import styles from "@/features/Evidence/components/TablePaginationControls/TablePaginationControls.module.scss";
import Select from "@/features/Core/components/Select/Select";
import ReactPaginate from "react-paginate";
import NextIcon from '@/assets/icons/directional/Chevron/Chevron Right.svg?react';
import PreviousIcon from '@/assets/icons/directional/Chevron/Chevron Left.svg?react';

interface TablePaginationControlsProps {
  label: string;
  itemsPerPage: number;
  currentPage: number;
  pageCount: number;
  onItemsPerPageChange: (value: number) => void;
  onPageChange: (event: { selected: number }) => void;
}

const TablePaginationControls: FC<TablePaginationControlsProps> = ({
  label,
  itemsPerPage,
  currentPage,
  pageCount,
  onItemsPerPageChange,
  onPageChange,
}) => (
  <div className={styles.tablePagination}>
    <div className={styles.perPage}>
      <p className={styles.label}>{label}</p>
      <Select
        label=""
        name="Items Per Page"
        handleChange={onItemsPerPageChange}
        value={itemsPerPage}
      >
        {[5, 10, 20].map(value => (
          <option key={value} value={value}>{value}</option>
        ))}
      </Select>
    </div>
    <div className={styles.pagination}>
      <ReactPaginate
        breakLabel="..."
        nextLabel={<NextIcon />}
        previousLabel={<PreviousIcon />}
        onPageChange={onPageChange}
        pageRangeDisplayed={2}
        marginPagesDisplayed={2}
        pageCount={pageCount}
        renderOnZeroPageCount={null}
        className={styles.pageNums}
        pageClassName={styles.pageNum}
        activeClassName={styles.current}
        previousLinkClassName={styles.button}
        nextLinkClassName={styles.button}
        disabledLinkClassName={styles.disabled}
        forcePage={currentPage}
      />
    </div>
  </div>
);

export default TablePaginationControls;
