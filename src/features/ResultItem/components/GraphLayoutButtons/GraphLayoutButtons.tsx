import { Dispatch, FC, SetStateAction } from 'react';
import styles from './GraphLayoutButtons.module.scss';
import { layoutList } from '@/features/ResultItem/utils/graphFunctions';
import { capitalizeAllWords } from '@/features/Common/utils/utilities';
import Button from '@/features/Common/components/Button/Button';
import { GraphLayout } from '../../types/graph';

interface GraphLayoutButtonsProps {
  setCurrentLayout: Dispatch<SetStateAction<GraphLayout>>;
  currentLayout: GraphLayout;
}

const GraphLayoutButtons: FC<GraphLayoutButtonsProps> = ({setCurrentLayout, currentLayout}) => {

  return (
    <div className={styles.layoutContainer}>
      <h4 className={styles.layoutHeader}>Layout Type:</h4>
      {
        Object.keys(layoutList).map((key) => {
          const name = layoutList[key as keyof typeof layoutList].label;
          return(
            <Button 
              className={`${styles.layoutButton} ${(currentLayout.name === layoutList[key].name)? styles.active : ''}`} 
              handleClick={()=>setCurrentLayout(layoutList[key])}
              key={key}
              >
              {capitalizeAllWords(name)}
            </Button>
          )
        })
      }
    </div>
  )
}

export default GraphLayoutButtons;