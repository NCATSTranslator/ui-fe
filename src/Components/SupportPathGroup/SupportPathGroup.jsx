import { useState, useEffect } from 'react';
import styles from './SupportPathGroup.module.scss';
import SupportPath from '../SupportPath/SupportPath';
import AnimateHeight from '../AnimateHeight/AnimateHeight';

const SupportPathGroup = ({ dataObj, isExpanded }) => {

  const pathItem = dataObj.pathItem;
  const pathViewStyles = dataObj.pathViewStyles;
  const key = dataObj.key;
  const selectedPaths = dataObj.selectedPaths;
  const pathToDisplay = dataObj.pathToDisplay;
  const handleActivateEvidence = dataObj.handleActivateEvidence;
  const handleNameClick = dataObj.handleNameClick;
  const handleEdgeClick = dataObj.handleEdgeClick;
  const handleTargetClick = dataObj.handleTargetClick;
  const activeStringFilters = dataObj.activeStringFilters;
  
  const initHeight = (isExpanded) ? 'auto' : 0;
  const [height, setHeight] = useState(initHeight);

  useEffect(() => {
    if(isExpanded === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [isExpanded])

  return(
    <AnimateHeight
      className={`${pathViewStyles.support} ${styles.support} ${isExpanded ? styles.open : styles.closed }`}
      duration={500}
      height={height}
    >
      {
        pathItem.support.sort((a, b) => b.highlighted - a.highlighted).map((supportPath, i) => {
          let pathKey = `${key}_${i}`;
          const tooltipID = supportPath.path.subgraph.map((sub, j) => (j % 2 === 0) ? sub.name : sub.predicates[0] );
          return (
            <SupportPath 
              dataObj={{
                key: pathKey,
                pathViewStyles: pathViewStyles,
                tooltipID: tooltipID,
                supportPath: supportPath, 
                selectedPaths: selectedPaths, 
                pathToDisplay: pathToDisplay, 
                handleActivateEvidence: handleActivateEvidence, 
                handleNameClick: handleNameClick, 
                handleEdgeClick: handleEdgeClick, 
                handleTargetClick: handleTargetClick, 
                activeStringFilters: activeStringFilters
              }}
            />
          );
        })
      }
    </AnimateHeight>
  )
}
export default SupportPathGroup;