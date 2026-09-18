import { FC } from "react";
import styles from "@/features/Evidence/components/TablePaginationControls/TablePaginationControls.module.scss";
import Select from "@/features/Core/components/Select/Select";
import ReactPaginate from "react-paginate";
import NextIcon from '@/assets/icons/directional/Chevron/Chevron Right.svg?react';
import PreviousIcon from '@/assets/icons/directional/Chevron/Chevron Left.svg?react';
import { EvidenceTabName } from '@/features/Evidence/types/navigation';
import { trackEvent } from '@/features/Analytics/utils/dataLayer';

interface TablePaginationControlsProps {
  label: string;
  /** The evidence tab this table belongs to, reported as tab_name so it matches evidence_tab_changed. */
  tabName: EvidenceTabName;
  itemsPerPage: number;
  currentPage: number;
  pageCount: number;
  onItemsPerPageChange: (value: number) => void;
  onPageChange: (event: { selected: number }) => void;
}

const TablePaginationControls: FC<TablePaginationControlsProps> = ({
  label,
  tabName,
  itemsPerPage,
  currentPage,
  pageCount,
  onItemsPerPageChange,
  onPageChange,
}) => {
  const handlePageChange = (event: { selected: number }) => {
    trackEvent('evidence_paginated', {
      tab_name: tabName,
      page_number: event.selected + 1,
    });
    onPageChange(event);
  };

  return (
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
        onPageChange={handlePageChange}
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
};

export default TablePaginationControls;
