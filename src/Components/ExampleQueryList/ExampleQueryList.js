import styles from './ExampleQueryList.module.scss';
import { getResultsShareURLPath } from '../../Utilities/resultsInteractionFunctions';
import { queryTypes } from '../../Utilities/queryTypes';

const ExampleQueryList = ({examples, setPresetURL, label}) => {

  return(
    <div className={styles.examples}>
    {examples && Array.isArray(examples) &&
      <>
        <p className={styles.subTwo}>{label}</p>
        <div className={styles.exampleList}>
          {
            examples.map((item, i)=> {
              let typeID = (item.type === "drug")
                ? 0
                : queryTypes.findIndex(
                  (el) => el.direction
                    && el.direction.toLowerCase() === item.direction.toLowerCase() 
                    && el.targetType.toLowerCase() === item.type.toLowerCase()
                ); 
              return(
                <button
                  className={styles.button}
                  onClick={(e)=>{
                    setPresetURL(e.target.dataset.url);
                  }}
                  data-testid={item.name}
                  data-url={getResultsShareURLPath(item.name, item.id, typeID, item.uuid)}
                  key={item.id}
                  >
                  {item.name}
              </button>
              )
            })
          }
        </div>
      </>
    }
  </div>
  )
}

export default ExampleQueryList;