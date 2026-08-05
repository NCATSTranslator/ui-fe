import { FC } from 'react';
import styles from './CanvasObjectList.module.scss';
import type { AnnotationSortMode, ObjectSortMode } from '@/features/Canvas/utils/canvasFunctions';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import OutsideClickHandler from '@/features/Core/components/OutsideClickHandler/OutsideClickHandler';
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import type { CanvasObjectListTab } from './canvasObjectListConstants';
import { ANNOTATION_SORT_OPTIONS, OBJECT_SORT_OPTIONS } from './canvasObjectListConstants';

interface ObjectListControlsProps {
  activeTab: CanvasObjectListTab;
  searchTerm: string;
  searchPlaceholder: string;
  onSearch: (value: string) => void;
  sortLabel: string;
  sortDropdownOpen: boolean;
  onSortDropdownToggle: () => void;
  onSortDropdownClose: () => void;
  activeSortKey: ObjectSortMode | AnnotationSortMode;
  onSortSelect: (key: ObjectSortMode | AnnotationSortMode) => void;
}

const ObjectListControls: FC<ObjectListControlsProps> = ({
  activeTab,
  searchTerm,
  searchPlaceholder,
  onSearch,
  sortLabel,
  sortDropdownOpen,
  onSortDropdownToggle,
  onSortDropdownClose,
  activeSortKey,
  onSortSelect,
}) => {
  const sortOptions = activeTab === 'objects' ? OBJECT_SORT_OPTIONS : ANNOTATION_SORT_OPTIONS;

  return (
    <div className={styles.controls}>
      <div className={styles.searchWrapper}>
        <SearchIcon className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={e => onSearch(e.target.value)}
        />
      </div>
      <OutsideClickHandler onOutsideClick={onSortDropdownClose}>
        <div className={styles.sortWrapper}>
          <button
            type="button"
            className={styles.sortButton}
            onClick={onSortDropdownToggle}
          >
            Sort: {sortLabel}
          </button>
          {sortDropdownOpen && (
            <div className={styles.sortDropdown}>
              {sortOptions.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className={joinClasses(styles.sortOption, activeSortKey === key && styles.activeSortOption)}
                  onClick={() => onSortSelect(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </OutsideClickHandler>
    </div>
  );
};

export default ObjectListControls;
