import { FC } from "react";
import { SortingState } from "@/features/Evidence/types/evidence";
import styles from "@/features/Evidence/components/PublicationsTable/PublicationsTable.module.scss";
import ChevUp from "@/assets/icons/directional/Chevron/Chevron Up.svg?react";

const PublicationsTableHeader: FC<{
  sortingState: SortingState;
  onSort: (sortType: string) => void;
}> = ({ sortingState, onSort }) => (
  <thead className="table-head">
    <tr>
      {[
        { key: 'title', label: 'Title', sortKey: 'title' },
        { key: 'pubdate', label: 'Date(s)', sortKey: 'date' },
        { key: 'source', label: 'Journal', sortKey: 'journal' },
        { key: 'snippet', label: 'Snippet' },
        { key: 'knowledgeLevel', label: 'Source & Rationale' },
      ].map(({ key, label, sortKey }) => (
        <th
          key={key}
          className={`head ${styles.head} ${styles[key]} ${
            sortKey ? (sortingState[sortKey as keyof SortingState] ? 'true' : 
              sortingState[sortKey as keyof SortingState] === null ? '' : 'false') : ''
          }`}
          onClick={sortKey ? () => onSort(sortKey) : undefined}
        >
          <span className={`head-span ${styles.headSpan}`}>
            {label}
            {sortKey && <ChevUp className='chev'/>}
          </span>
        </th>
      ))}
    </tr>
  </thead>
);

export default PublicationsTableHeader;