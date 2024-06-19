import { useState, useEffect, memo, FC } from 'react';
import styles from './SupportPathGroup.module.scss';
import SupportPath from '../SupportPath/SupportPath';
import AnimateHeight from '../AnimateHeight/AnimateHeight';
import { sortSupportByEntityStrings, sortSupportByLength } from '../../Utilities/sortingFunctions';
import { FormattedEdgeObject, FormattedNodeObject, SupportDataObject } from '../../Types/results';
import { isFormattedEdgeObject, isFormattedNodeObject } from '../../Utilities/utilities';
import { cloneDeep } from 'lodash';

interface SupportPathGroupProps {
  dataObj: SupportDataObject;
  isExpanded: boolean;
}

const SupportPathGroup: FC<SupportPathGroupProps> = ({ dataObj, isExpanded }) => {

  const pathItem = dataObj.pathItem;
  const pathViewStyles = dataObj.pathViewStyles;
  const key = dataObj.key;
  const activeStringFilters = dataObj.activeStringFilters;
  const initHeight = (isExpanded) ? 'auto' : 0;
  const [height, setHeight] = useState<number | string>(initHeight);

  useEffect(() => {
    if(isExpanded === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [isExpanded])

  if(isFormattedEdgeObject(pathItem)) {
    // if there are any active string filters, sort by those
    if(activeStringFilters.length > 0 && pathItem.support) {
      sortSupportByEntityStrings(pathItem.support, activeStringFilters);
    // otherwise sort by shortest path length first
    } else {
      sortSupportByLength(pathItem.support);
    }
  }

  const generateTooltipID = (subgraph: (FormattedNodeObject | FormattedEdgeObject)[]) => {
    return subgraph.map((sub) => {
      if(isFormattedEdgeObject(sub)) {
        return !!sub.predicates && sub.predicates[0].predicate;
      } 
      if(isFormattedNodeObject(sub)) {
        return sub.name;
      }
      return "";
    }).join("-");
  }

  return(
    <AnimateHeight
      className={`${!!pathViewStyles && pathViewStyles.support} ${styles.support} ${isExpanded ? styles.open : styles.closed }`}
      duration={500}
      height={typeof height === "number" ? height : 'auto'}
    >
      {
        isFormattedEdgeObject(pathItem) &&
        pathItem.support && 
        pathItem.support.sort((a, b) => Number(b.highlighted) - Number(a.highlighted)).map((supportPath) => {
          let pathKey = `${key}_${supportPath.id}`;
          const tooltipID = generateTooltipID(supportPath.path.subgraph);
          let newDataObj = cloneDeep(dataObj);
          newDataObj.tooltipID = tooltipID;
          newDataObj.supportPath = supportPath;
          newDataObj.key = pathKey;
          return ( 
            <SupportPath
              dataObj={newDataObj}
            />
          );
        })
      }
    </AnimateHeight>
  )
}

const areEqualProps = (prevProps: any, nextProps: any) => {
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