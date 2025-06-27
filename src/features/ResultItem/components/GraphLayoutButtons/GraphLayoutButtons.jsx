import styles from './GraphLayoutButtons.module.scss';
import { layoutList } from '@/features/ResultItem/utils/graphFunctions';
import { capitalizeAllWords } from '@/features/Common/utils/utilities';
import Button from '@/features/Common/components/Button/Button';

const GraphLayoutButtons = ({setCurrentLayout, currentLayout}) => {

  return (
    <div className={styles.layoutContainer}>
      <h4 className={styles.layoutHeader}>Layout Type:</h4>
      {
        Object.keys(layoutList).map((key) => {
          let name = layoutList[key].label;
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