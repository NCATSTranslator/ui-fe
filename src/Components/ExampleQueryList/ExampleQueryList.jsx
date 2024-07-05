import { useState, useRef, useEffect } from 'react';
import styles from './ExampleQueryList.module.scss';
import { getResultsShareURLPath } from '../../Utilities/resultsInteractionFunctions';
import { queryTypes } from '../../Utilities/queryTypes';
import { useSelector } from 'react-redux';
import { currentRoot } from '../../Redux/rootSlice';
import AnimateHeight from 'react-animate-height';

const ExampleQueryList = ({examples, setPresetURL, label, className = ""}) => {

  const root = useSelector(currentRoot);
  const minHeight = 52;
  const [height, setHeight] = useState(minHeight);
  const [examplesMaxHeight, setExamplesMaxHeight] = useState(0);
  const exampleListRef = useRef(null);

  const handleToggleHeight = () => {
    if(height === minHeight) 
      setHeight('auto');
    else
      setHeight(minHeight);
  }

  const checkHeightOnLoad = (ref) => {
    setExamplesMaxHeight(ref.contentElement.clientHeight);
  }

  useEffect(() => {
    if(exampleListRef.current)
      checkHeightOnLoad(exampleListRef.current);
  });

  return(
    <div className={`${styles.examplesContainer} ${className}`}>
      {
        root === "demo" && 
        <p className={styles.demoDisclaimer}>Login to run additional queries or select an example below.</p>
      }
      <div className={styles.examples}>
        {examples && Array.isArray(examples) &&
          <>
            <p className={styles.subTwo}>{label}</p>
            <AnimateHeight className={`${styles.exampleList}`}
              duration={0}
              height={height}
              ref={exampleListRef}
            >
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
                      className={`${styles.button} example-query`}
                      onClick={(e)=>{
                        setPresetURL(e.target.dataset.url);
                      }}
                      data-testid={item.name}
                      data-url={getResultsShareURLPath(item.name, item.id, typeID, '0', item.uuid)}
                      key={item.id}
                      >
                      {item.name}
                  </button>
                  )
                })
              }
            </AnimateHeight>
          </>
        }
      </div>
      {
        examplesMaxHeight > minHeight &&
        <button onClick={handleToggleHeight} className={`${styles.showButton} show-more-examples`}>
          {height === minHeight ? 'Show More' : 'Show Less' }
        </button>
      }
    </div>
  )
}

export default ExampleQueryList;