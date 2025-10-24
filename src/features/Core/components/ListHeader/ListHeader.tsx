import { FC, FormEvent, RefObject } from 'react';
import styles from './ListHeader.module.scss';
import ProjectSearchBar from '@/features/Projects/components/ProjectSearchBar/ProjectSearchBar';
import TextInput from '@/features/Core/components/TextInput/TextInput';
import OutsideClickHandler from '@/features/Common/components/OutsideClickHandler/OutsideClickHandler';

interface ListHeaderProps {
  heading: string;
  searchPlaceholder: string;
  searchTerm: string;
  handleSearch: (value: string) => void;
  isRenaming?: boolean;
  onTitleChange?: (value: string) => void;
  onFormSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  textInputRef?: RefObject<HTMLInputElement | null>;
  onOutsideClick?: () => void;
}

const ListHeader: FC<ListHeaderProps> = ({
  heading,
  searchPlaceholder,
  searchTerm,
  handleSearch,
  isRenaming,
  onTitleChange,
  onFormSubmit,
  textInputRef,
  onOutsideClick,
}) => {

  const handleOutsideClick = () => {
    if(onOutsideClick) onOutsideClick();
  }

  const headingContent = (
    isRenaming && onTitleChange && onFormSubmit ? (
      <OutsideClickHandler onOutsideClick={handleOutsideClick}>
        <form onSubmit={onFormSubmit}>
          <TextInput value={heading} handleChange={onTitleChange} iconRightClickToReset ref={textInputRef} className={styles.titleInput}/>
        </form>
      </OutsideClickHandler>
    ) : (
      <h1 className={`h5 ${styles.title}`}>{heading}</h1>
    )
  );

  return (
    <div className={styles.listHeader}>
      <div>
        {headingContent}
      </div>
      <div>
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