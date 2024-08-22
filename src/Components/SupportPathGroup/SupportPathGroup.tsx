import { useState, useEffect, memo, FC } from 'react';
import styles from './SupportPathGroup.module.scss';
import SupportPath from '../SupportPath/SupportPath';
import AnimateHeight from '../AnimateHeight/AnimateHeight';
import { sortSupportByEntityStrings, sortSupportByLength } from '../../Utilities/sortingFunctions';
import { FormattedEdgeObject, FormattedNodeObject, SupportDataObject, PathFilterState } from '../../Types/results';
import { isFormattedEdgeObject, isFormattedNodeObject } from '../../Utilities/utilities';
import { cloneDeep } from 'lodash';

interface SupportPathGroupProps {
  dataObj: SupportDataObject;
  isExpanded: boolean;
  pathFilterState: PathFilterState;
}

const SupportPathGroup: FC<SupportPathGroupProps> = ({ dataObj, isExpanded, pathFilterState }) => {

  const pathItem = dataObj.pathItem;
  const pathViewStyles = dataObj.pathViewStyles;
  const key = dataObj.key;
  const activeEntityFilters = dataObj.activeEntityFilters;
  const initHeight = (isExpanded) ? 'auto' : 0;
  const [height, setHeight] = useState<number | string>(initHeight);

  useEffect(() => {
    if(isExpanded === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [isExpanded])

  useEffect(() => {
    if(isFormattedEdgeObject(pathItem)) {
      // if there are any active string filters, sort by those
      if(activeEntityFilters.length > 0 && pathItem.support) {
        sortSupportByEntityStrings(pathItem.support, activeEntityFilters);
      // otherwise sort by shortest path length first
      } else {
        sortSupportByLength(pathItem.support);
      }
    }
  }, [pathItem, activeEntityFilters]);

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
      <p className={styles.supportLabel}>Supporting Paths</p>
      {
        isFormattedEdgeObject(pathItem) &&
        pathItem.support &&
        pathItem.support.sort((a, b) => Number(b.highlighted) - Number(a.highlighted)).map((supportPath, i) => {
          let pathKey = `${key}_${supportPath.id}`;
          const tooltipID = generateTooltipID(supportPath.path.subgraph);
          let newDataObj = cloneDeep(dataObj);
          newDataObj.tooltipID = tooltipID;
          newDataObj.supportPath = supportPath;
          newDataObj.key = pathKey;
          return (
            <SupportPath
              dataObj={newDataObj}
              index={i}
              pathFilterState={pathFilterState}
            />
          );
        })
      }
    </AnimateHeight>
  )
}

const areEqualProps = (prevProps: any, nextProps: any) => {
  // Check if 'isExpanded' prop has changed
  if (prevProps.isExpanded !== nextProps.isExpanded) return false;
  const prevDataKeys = Object.keys(prevProps.dataObj);
  const nextDataKeys = Object.keys(nextProps.dataObj);
  if (prevDataKeys.length !== nextDataKeys.length) return false;
  for (const key of prevDataKeys) {
    if (prevProps.dataObj[key] !== nextProps.dataObj[key]) {
      return false;
    }
  }

  // If none of the above conditions are met, props are equal
  return true;
};

export default memo(SupportPathGroup, areEqualProps);
