import { FC } from 'react';
import TextInput from '@/features/Core/components/TextInput/TextInput';
import Search from '@/assets/icons/buttons/search.svg?react';
import Close from '@/assets/icons/buttons/Close/Close.svg?react';

interface ProjectSearchBarProps {
  handleSearch: (value: string) => void;
  searchPlaceholder: string;
  searchTerm: string;
  styles: { [key: string]: string };
}

const ProjectSearchBar: FC<ProjectSearchBarProps> = ({
  handleSearch,
  searchPlaceholder,
  searchTerm,
  styles
}) => {
  return (
    <div className={styles.searchSection}>
      <TextInput
        placeholder={searchPlaceholder}
        iconLeft={<Search />}
        iconRight={searchTerm.length > 0 ? <Close /> : null}
        handleChange={handleSearch}
        className={styles.searchInput}
        iconRightClickToReset={searchTerm.length > 0}
      />
    </div>
  );
};

export default ProjectSearchBar;