import { FC, useCallback } from 'react';
import { debounce } from 'lodash';
import Button from '@/features/Core/components/Button/Button';
import styles from './ProjectListHeader.module.scss';
import FolderPlus from '@/assets/icons/projects/folderplus.svg?react';
import TextInput from '@/features/Core/components/TextInput/TextInput';
import Search from '@/assets/icons/buttons/search.svg?react';
import Close from '@/assets/icons/buttons/Close/Close.svg?react';

interface ProjectListHeaderProps {
  searchTerm?: string;
  setSearchTerm?: (searchTerm: string) => void;
}

const ProjectListHeader: FC<ProjectListHeaderProps> = ({
  searchTerm = "",
  setSearchTerm
}) => {

  const placeholderText = 'Search by Project or Query Name';

  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      setSearchTerm?.(searchTerm);
    }, 500),
    [setSearchTerm]
  );

  const handleSearch = (e: string) => {
    if (e.length > 0)
      debouncedSearch(e);
    else
      setSearchTerm?.('');
  }

  return (
    <div className={styles.projectListHeader}>
      <div className={styles.left}>
        <h1 className={`h4`}>Projects</h1>
        <Button
          iconLeft={<FolderPlus />}
        >
          Create New
        </Button>
      </div>
      <div className={styles.right}>
        <TextInput
          placeholder={placeholderText}
          iconLeft={<Search />}
          iconRight={searchTerm.length > 0 ? <Close /> : null}
          handleChange={handleSearch}
          className={styles.searchInput}
          iconRightClickToReset={searchTerm.length > 0}
        />
      </div>
    </div>
  );
}

export default ProjectListHeader;