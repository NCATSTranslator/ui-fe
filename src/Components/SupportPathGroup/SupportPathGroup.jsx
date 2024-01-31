import { useState, useEffect, memo } from 'react';
import styles from './SupportPathGroup.module.scss';
import SupportPath from '../SupportPath/SupportPath';
import AnimateHeight from '../AnimateHeight/AnimateHeight';

const SupportPathGroup = ({ dataObj, isExpanded }) => {

  const pathItem = dataObj.pathItem;
  const pathViewStyles = dataObj.pathViewStyles;
  const key = dataObj.key;
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
          const tooltipID = supportPath.path.subgraph.map((sub, j) => (j % 2 === 0) ? sub.name : sub.predicates[0] ).join("-");
          dataObj.key = pathKey;
          dataObj.supportPath = supportPath;
          dataObj.tooltipID = tooltipID;
          return ( 
            <SupportPath
              dataObj={dataObj}
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