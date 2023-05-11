import styles from './GraphLayoutButtons.module.scss';
import { layoutList } from '../../Utilities/graphFunctions';

const GraphLayoutButtons = ({setCurrentLayout, currentLayout}) => {

  return (
    <div className={styles.layoutContainer}>
      <h4 className={styles.layoutHeader}>Layout Type:</h4>
      <button 
        className={`${styles.layoutButton} ${(currentLayout.name === 'klay')? styles.active : ''}`} 
        onClick={()=>setCurrentLayout(layoutList.klay)}
        >
        Klay
      </button>
      <button 
        className={`${styles.layoutButton} ${(currentLayout.name === 'breadthfirst')? styles.active : ''}`} 
        onClick={()=>setCurrentLayout(layoutList.breadthfirst)}
        >
        Breadthfirst
      </button>
      <button 
        className={`${styles.layoutButton} ${(currentLayout.name === 'dagre')? styles.active : ''}`} 
        onClick={()=>setCurrentLayout(layoutList.dagre)}
        >
        dagre
      </button>
      <button 
        className={`${styles.layoutButton} ${(currentLayout.name === 'random')? styles.active : ''}`} 
        onClick={()=>setCurrentLayout(layoutList.random)}
        >
        Random
      </button>
      <button 
        className={`${styles.layoutButton} ${(currentLayout.name === 'avsdf')? styles.active : ''}`} 
        onClick={()=>setCurrentLayout(layoutList.avsdf)}
        >
        avsdf
      </button>
      <button 
        className={`${styles.layoutButton} ${(currentLayout.name === 'circle')? styles.active : ''}`} 
        onClick={()=>setCurrentLayout(layoutList.circle)}
        >
        Circle
      </button>
      <button 
        className={`${styles.layoutButton} ${(currentLayout.name === 'concentric')? styles.active : ''}`} 
        onClick={()=>setCurrentLayout(layoutList.concentric)}
        >
        Concentric
      </button>
      <button 
        className={`${styles.layoutButton} ${(currentLayout.name === 'cose')? styles.active : ''}`} 
        onClick={()=>setCurrentLayout(layoutList.cose)}
        >
        Cose
      </button>
    </div>
  )
}

export default GraphLayoutButtons;