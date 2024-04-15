import { useState, useEffect, memo } from 'react';
import styles from './SupportPathGroup.module.scss';
import SupportPath from '../SupportPath/SupportPath';
import AnimateHeight from '../AnimateHeight/AnimateHeight';
import { sortSupportByEntityStrings, sortSupportByLength } from '../../Utilities/sortingFunctions';

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

  // if there are any active string filters, sort by those
  if(activeStringFilters.length > 0 && pathItem.support) {
    sortSupportByEntityStrings(pathItem.support, activeStringFilters);
  // otherwise sort by shortest path length first
  } else {
    sortSupportByLength(pathItem.support);
  }

  return(
    <AnimateHeight
      className={`${pathViewStyles.support} ${styles.support} ${isExpanded ? styles.open : styles.closed }`}
      duration={500}
      height={height}
    >
      {
        pathItem.support && 
        pathItem.support.sort((a, b) => b.highlighted - a.highlighted).map((supportPath, i) => {
          let pathKey = `${key}_${i}`;
          const tooltipID = supportPath.path.subgraph.map((sub, j) => (j % 2 === 0) ? sub.name : sub.predicates[0].predicate ).join("-");
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

const areEqualProps = (prevProps, nextProps) => {
  // Check if 'isExpanded' prop has changed
  if (prevProps.isExpanded !== nextProps.isExpanded) {
    return false;
  }

  // Perform a shallow comparison of 'dataObj' properties
  const prevDataKeys = Object.keys(prevProps.dataObj);
  const nextDataKeys = Object.keys(nextProps.dataObj);

  if (prevDataKeys.length !== nextDataKeys.length) {
    return false;
  }

  for (const key of prevDataKeys) {
    if (prevProps.dataObj[key] !== nextProps.dataObj[key]) {
      return false;
    }
  }

  // If none of the above conditions are met, props are equal
  return true;
};

export default memo(SupportPathGroup, areEqualProps);