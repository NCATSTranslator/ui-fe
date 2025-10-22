import { FC } from 'react';
import styles from './ListHeader.module.scss';
import ProjectSearchBar from '@/features/Projects/components/ProjectSearchBar/ProjectSearchBar';

interface ListHeaderProps {
  heading: string;
  searchPlaceholder: string;
  searchTerm: string;
  handleSearch: (value: string) => void;
}

const ListHeader: FC<ListHeaderProps> = ({
  heading,
  searchPlaceholder,
  searchTerm,
  handleSearch,
}) => {
  return (
    <div className={styles.listHeader}>
      <div className={styles.left}>
        <h1 className={`h5 ${styles.title}`}>{heading}</h1>
      </div>
      <div className={styles.right}>
        <ProjectSearchBar
          searchPlaceholder={searchPlaceholder}
          searchTerm={searchTerm}
          handleSearch={handleSearch}
          styles={styles}
        />
      </div>
    </div>
  )
}

export default ListHeader;