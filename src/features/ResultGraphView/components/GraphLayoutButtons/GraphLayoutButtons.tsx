import { Dispatch, FC, SetStateAction } from 'react';
import styles from './GraphLayoutButtons.module.scss';
import Button from '@/features/Core/components/Button/Button';
import { LayoutType } from 'translator-graph-view';

const layouts: { key: LayoutType; label: string }[] = [
  { key: 'hierarchicalLR', label: 'Horizontal' },
  { key: 'hierarchical', label: 'Vertical' },
  { key: 'force', label: 'Force' },
];

interface GraphLayoutButtonsProps {
  setCurrentLayout: Dispatch<SetStateAction<LayoutType>>;
  currentLayout: LayoutType;
}

const GraphLayoutButtons: FC<GraphLayoutButtonsProps> = ({setCurrentLayout, currentLayout}) => {

  return (
    <div className={styles.layoutContainer}>
      <h4 className={styles.layoutHeader}>Layout Type:</h4>
      <div className={styles.layoutButtonContainer}>
      {
        layouts.map(({ key, label }) => (
          <Button
            className={`${styles.layoutButton} ${currentLayout === key ? styles.active : ''}`}
            handleClick={() => setCurrentLayout(key)}
            key={key}
            variant="secondary"
          >
            {label}
          </Button>
        ))
      }
      </div>
    </div>
  )
}

export default GraphLayoutButtons;
