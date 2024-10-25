import { useState, useEffect, FC, useRef } from 'react';
import styles from './SupportPathGroup.module.scss';
import SupportPath from '../SupportPath/SupportPath';
import AnimateHeight from '../AnimateHeight/AnimateHeight';
import ReactPaginate from 'react-paginate';
import ChevLeft from '../../Icons/Directional/Chevron/Chevron Left.svg?react';
import ChevRight from '../../Icons/Directional/Chevron/Chevron Right.svg?react';
import { sortSupportByEntityStrings, sortSupportByLength } from '../../Utilities/sortingFunctions';
import { FormattedEdgeObject, FormattedNodeObject, SupportDataObject, PathFilterState } from '../../Types/results';
import { intToChar, isFormattedEdgeObject, isFormattedNodeObject } from '../../Utilities/utilities';
import { cloneDeep } from 'lodash';

interface SupportPathGroupProps {
  dataObj: SupportDataObject;
  isExpanded: boolean;
  pathFilterState: PathFilterState;
}

const SupportPathGroup: FC<SupportPathGroupProps> = ({ dataObj, isExpanded, pathFilterState }) => {

  const pathItem = dataObj.pathItem as FormattedEdgeObject;
  const pathViewStyles = dataObj.pathViewStyles;
  const key = dataObj.key;
  const activeEntityFilters = dataObj.activeEntityFilters;
  const initHeight = (isExpanded) ? 'auto' : 0;
  const [height, setHeight] = useState<number | string>(initHeight);

  const itemsPerPage: number = 10;
  const [itemOffset, setItemOffset] = useState<number>(0);
  const currentPage = useRef<number>(0);
  const endResultIndex = useRef<number>(itemsPerPage);
  
  const handlePageClick = (event: {selected: number} ) => {
    let pathsLength = pathItem.support?.length;
    if(!pathsLength)
      return;
    currentPage.current = event.selected;
    const newOffset:number = isNaN((event.selected * itemsPerPage) % pathsLength) ? 0 : (event.selected * itemsPerPage) % pathsLength;
    const endOffset:number = (newOffset + itemsPerPage) > pathsLength
      ? pathsLength
      : newOffset + itemsPerPage;
    setItemOffset(newOffset);
    endResultIndex.current = endOffset;
  }

  const displayedPaths = (!!pathItem.support) 
    ? pathItem.support.sort((a, b) => Number(b.highlighted) - Number(a.highlighted)).slice(itemOffset, endResultIndex.current)
    : null;

  // const displayedPaths = useMemo(()=> {
  //   if(!!pathItem.support) 
  //     return pathItem.support.sort((a, b) => Number(b.highlighted) - Number(a.highlighted)).slice(itemOffset, endResultIndex.current);
  //   else
  //     return null;
  // }, [pathItem, itemOffset, endResultIndex, pathFilterState]);
  const pageCount = (!!pathItem.support) ? Math.ceil(pathItem.support.length / itemsPerPage) : 0;

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
      <div className={`${!!pathViewStyles && pathViewStyles.supportGroupContainer} scrollable-support`}>
        <p className={styles.supportLabel}>Supporting Paths</p>
        {
          !!displayedPaths && 
          displayedPaths.map((supportPath) => {
            let pathKey = `${key}_${supportPath.id}`;
            const tooltipID = generateTooltipID(supportPath.path.subgraph);
            let newDataObj = cloneDeep(dataObj);
            newDataObj.tooltipID = tooltipID;
            newDataObj.supportPath = supportPath;
            newDataObj.key = pathKey;
            const indexInFullCollection = (!!pathItem.support) ? pathItem.support.findIndex(item => item.id === supportPath.id) : -1;
            const character = intToChar(indexInFullCollection + 1);
            return (
              <SupportPath
                key={supportPath.id}
                dataObj={newDataObj}
                character={character}
                pathFilterState={pathFilterState}
              />
            );
          })
        }
      </div>
      {
        pageCount > 1 &&
        <div className={styles.paginationContainer}>
          <ReactPaginate
            breakLabel="..."
            nextLabel={<ChevRight/>}
            previousLabel={<ChevLeft/>}
            onPageChange={handlePageClick}
            pageRangeDisplayed={5}
            marginPagesDisplayed={1}
            pageCount={pageCount}
            renderOnZeroPageCount={null}
            className='pageNums'
            pageClassName='pageNum'
            activeClassName='current'
            previousLinkClassName={`button ${styles.button}`}
            nextLinkClassName={`button ${styles.button}`}
            disabledLinkClassName={`disabled ${styles.disabled}`}
            forcePage={currentPage.current}
          />
        </div>
      }
    </AnimateHeight>
  )
}

export default SupportPathGroup;
