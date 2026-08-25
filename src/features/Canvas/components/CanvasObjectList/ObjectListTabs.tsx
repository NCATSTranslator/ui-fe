import { FC } from 'react';
import styles from './CanvasObjectList.module.scss';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import type { CanvasObjectListTab } from './canvasObjectListConstants';

interface ObjectListTabsProps {
  activeTab: CanvasObjectListTab;
  objectCount: number;
  annotationCount: number;
  onTabChange: (tab: CanvasObjectListTab) => void;
}

const ObjectListTabs: FC<ObjectListTabsProps> = ({
  activeTab,
  objectCount,
  annotationCount,
  onTabChange,
}) => (
  <div className={styles.tabs}>
    <button
      type="button"
      className={joinClasses(styles.tab, activeTab === 'objects' && styles.activeTab)}
      onClick={() => onTabChange('objects')}
    >
      Objects ({objectCount})
    </button>
    <button
      type="button"
      className={joinClasses(styles.tab, activeTab === 'annotations' && styles.activeTab)}
      onClick={() => onTabChange('annotations')}
    >
      Annotations ({annotationCount})
    </button>
  </div>
);

export default ObjectListTabs;
