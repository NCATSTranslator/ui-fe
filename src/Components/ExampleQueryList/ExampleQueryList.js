import styles from './ExampleQueryList.module.scss';
import { getResultsShareURLPath } from '../../Utilities/resultsInteractionFunctions';

const ExampleQueryList = ({examples, setPresetURL}) => {

  return(
    <div className={styles.examples}>
    {examples && Array.isArray(examples) &&
      <>
        <p className={styles.subTwo}>Example Diseases:</p>
        <div className={styles.exampleList}>
          {
            examples.map((item, i)=> {
              return(
                <button
                  className={styles.button}
                  onClick={(e)=>{
                    setPresetURL(e.target.dataset.url);
                  }}
                  data-testid={item.name}
                  data-url={getResultsShareURLPath(item.name, item.id, 0, item.uuid)}
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