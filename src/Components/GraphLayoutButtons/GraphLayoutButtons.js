import styles from './GraphLayoutButtons.module.scss';
import { layoutList } from '../../Utilities/graphFunctions';
import { capitalizeAllWords } from '../../Utilities/utilities';

const GraphLayoutButtons = ({setCurrentLayout, currentLayout}) => {

  return (
    <div className={styles.layoutContainer}>
      <h4 className={styles.layoutHeader}>Layout Type:</h4>
      {
        Object.keys(layoutList).map((key) => {
          return(
            <button 
              className={`${styles.layoutButton} ${(currentLayout.name === layoutList[key].name)? styles.active : ''}`} 
              onClick={()=>setCurrentLayout(layoutList[key])}
              key={key}
              >
              {capitalizeAllWords(layoutList[key].name)}
            </button>
          )
        })
      }
    </div>
  )
}

export default GraphLayoutButtons;