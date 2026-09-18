import { FC } from "react";
import { SortingState } from "@/features/Evidence/types/evidence";
import styles from "@/features/Evidence/components/PublicationsTable/PublicationsTable.module.scss";
import ChevUp from "@/assets/icons/directional/Chevron/Chevron Up.svg?react";
import { joinClasses } from "@/features/Core/utils/classHelpers";

const headerItems = [
  { key: 'title', label: 'Title', sortKey: 'title' },
  { key: 'pubdate', label: 'Date(s)', sortKey: 'date' },
  { key: 'source', label: 'Journal', sortKey: 'journal' },
  { key: 'snippet', label: 'Snippet' },
  { key: 'knowledgeLevel', label: 'Source & Rationale' },
];

const PublicationsTableHeader: FC<{
  sortingState: SortingState;
  onSort: (sortType: string) => void;
}> = ({ sortingState, onSort }) => {

  const getSortClass = (sortKey: string | undefined) => {
    if (!sortKey) return '';
    const value = sortingState[sortKey as keyof SortingState];
    if (value) return 'true';
    return value === null ? '' : 'false';
  }

  return (
    <thead className="table-head">
      <tr>
        {headerItems.map(({ key, label, sortKey }) => (
          <th
            key={key}
            className={joinClasses('head', styles.head, styles[key], getSortClass(sortKey))}
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
}

export default PublicationsTableHeader;