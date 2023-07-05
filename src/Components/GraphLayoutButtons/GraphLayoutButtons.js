import styles from './GraphLayoutButtons.module.scss';
import { layoutList } from '../../Utilities/graphFunctions';
import { capitalizeAllWords } from '../../Utilities/utilities';

const GraphLayoutButtons = ({setCurrentLayout, currentLayout}) => {

  return (
    <div className={styles.layoutContainer}>
      <h4 className={styles.layoutHeader}>Layout Type:</h4>
      {
        Object.keys(layoutList).map((key) => {
          let name = "";
          switch (layoutList[key].name) {
            case "klay":
              name = "Horizontal";
              break;
            case "breadthfirst":
              name = "Vertical";
              break;
            case "concentric":
              name = "Concentric";
              break;
            default:
              name = layoutList[key].name;
              break;
          }
          return(
            <button 
              className={`${styles.layoutButton} ${(currentLayout.name === layoutList[key].name)? styles.active : ''}`} 
              onClick={()=>setCurrentLayout(layoutList[key])}
              key={key}
              >
              {capitalizeAllWords(name)}
            </button>
          )
        })
      }
    </div>
  )
}

export default GraphLayoutButtons;