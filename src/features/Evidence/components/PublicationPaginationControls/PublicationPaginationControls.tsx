import { FC } from "react";
import styles from "@/features/Evidence/components/PublicationsTable/PublicationsTable.module.scss";
import Select from "@/features/Common/components/Select/Select";
import ReactPaginate from "react-paginate";

const PublicationPaginationControls: FC<{
  itemsPerPage: number;
  currentPage: number;
  pageCount: number;
  onItemsPerPageChange: (value: number) => void;
  onPageChange: (event: { selected: number }) => void;
}> = ({ itemsPerPage, currentPage, pageCount, onItemsPerPageChange, onPageChange }) => (
  <div className={styles.bottom}>
    <div className={styles.perPage}>
      <p className={styles.label}>Publications per Page</p>
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
        nextLabel="Next"
        previousLabel="Previous"
        onPageChange={onPageChange}
        pageRangeDisplayed={2}
        marginPagesDisplayed={2}
        pageCount={pageCount}
        renderOnZeroPageCount={null}
        className={styles.pageNums}
        pageClassName={styles.pageNum}
        activeClassName={styles.current}
        previousLinkClassName={`${styles.prev} ${styles.button}`}
        nextLinkClassName={`${styles.prev} ${styles.button}`}
        disabledLinkClassName={styles.disabled}
        forcePage={currentPage}
      />
    </div>
  </div>
);

export default PublicationPaginationControls;