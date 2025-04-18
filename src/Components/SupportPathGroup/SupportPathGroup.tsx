import { useState, useEffect, FC, useRef, useMemo, createContext } from 'react';
import styles from './SupportPathGroup.module.scss';
import SupportPath from '../SupportPath/SupportPath';
import AnimateHeight from '../AnimateHeight/AnimateHeight';
import ReactPaginate from 'react-paginate';
import ChevLeft from '../../Icons/Directional/Chevron/Chevron Left.svg?react';
import ChevRight from '../../Icons/Directional/Chevron/Chevron Right.svg?react';
import { sortSupportByEntityStrings, sortSupportByLength } from '../../Utilities/sortingFunctions';
import { Filter, Path, PathFilterState, ResultNode } from '../../Types/results';
import { intToChar, getPathsWithSelectionsSet, isStringArray, getFilteredPathCount, intToNumeral } from '../../Utilities/utilities';
import { useSelector } from 'react-redux';
import { getResultSetById, getPathsByIds } from '../../Redux/resultsSlice';
import { useSupportPathDepth, useSupportPathKey } from '../../Utilities/customHooks';
import { SupportPathDepthContext } from '../PathView/PathView';

export const SupportPathKeyContext = createContext<string>("");

interface SupportPathGroupProps {
  activeFilters: Filter[];
  activeEntityFilters: string[];
  handleActivateEvidence: (path: Path, pathKey: string) => void;
  handleEdgeClick: (edgeIDs: string[], path: Path, pathKey: string) => void;
  handleNodeClick: (name: ResultNode) => void;
  isExpanded: boolean;
  parentPathKey: string;
  pathFilterState: PathFilterState;
  pathArray: (string | Path)[];
  pathViewStyles: {[key: string]: string;} | null;
  pk: string;
  selectedPaths: Set<Path> | null;
  showHiddenPaths: boolean;
}

const SupportPathGroup: FC<SupportPathGroupProps> = ({ 
  activeFilters, 
  activeEntityFilters, 
  handleActivateEvidence, 
  handleEdgeClick, 
  handleNodeClick, 
  isExpanded,
  parentPathKey,
  pathFilterState,
  pathArray,
  pathViewStyles,
  pk,
  selectedPaths,
  showHiddenPaths }) => {

  const resultSet = useSelector(getResultSetById(pk));
  const paths = isStringArray(pathArray) ? getPathsByIds(resultSet, pathArray) : pathArray;
  const formattedPaths = useMemo(() => {
    const newPaths = getPathsWithSelectionsSet(resultSet, paths, pathFilterState, selectedPaths);
    if(activeEntityFilters.length > 0 && !!resultSet) {
      return sortSupportByEntityStrings(resultSet, newPaths, activeEntityFilters);
    // otherwise sort by shortest path length first
    } else {
      return sortSupportByLength(newPaths);
    }
  }, [paths, selectedPaths, pathFilterState, resultSet, activeEntityFilters]);

  const initHeight = (isExpanded) ? 'auto' : 0;
  const [height, setHeight] = useState<number | string>(initHeight);

  const filteredPathCount = getFilteredPathCount(formattedPaths, pathFilterState);
  const itemsPerPage: number = 10;
  const [itemOffset, setItemOffset] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(0);
  const endResultIndex = useRef<number>(itemsPerPage);
  const pageCount = (!!formattedPaths) ? Math.ceil((formattedPaths.length - filteredPathCount) / itemsPerPage) : 0;

  const parentDepth = useSupportPathDepth();
  const currentDepth = parentDepth + 1;
  const parentKey = useSupportPathKey();
  const currentKey = (!!parentPathKey && !!parentKey && !parentKey.includes(parentPathKey)) ? `${parentKey}.${parentPathKey}`: parentPathKey;
  
  const handlePageClick = (event: {selected: number} ) => {
    let pathsLength = pathArray.length;
    if(!pathsLength)
      return;
    setCurrentPage(event.selected);
    const newOffset:number = isNaN((event.selected * itemsPerPage) % pathsLength) ? 0 : (event.selected * itemsPerPage) % pathsLength;
    const endOffset:number = (newOffset + itemsPerPage) > pathsLength
      ? pathsLength
      : newOffset + itemsPerPage;
    setItemOffset(newOffset);
    endResultIndex.current = endOffset;
  }

  const displayedPaths = (!!formattedPaths) 
    ? formattedPaths.slice(itemOffset, endResultIndex.current)
    : [];

  useEffect(() => {
    if(isExpanded === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [isExpanded])

  return(
    <AnimateHeight
      className={`${!!pathViewStyles && pathViewStyles.support} ${styles.support} ${!isExpanded && styles.closed } ${currentDepth > 1 && styles.nested}`}
      duration={500}
      height={typeof height === "number" ? height : 'auto'}
    >
      <SupportPathDepthContext.Provider value={currentDepth}>
        <SupportPathKeyContext.Provider value={currentKey}>
          <div className={`${!!pathViewStyles && pathViewStyles.supportGroupContainer} scrollable-support`}>
            <p className={styles.supportLabel}>Supporting Paths</p>
            {
              displayedPaths.map((supportPath, i) => {
                if(!supportPath)
                  return null;
                const indexInFullCollection = itemOffset + i;
                const pathKey = currentDepth === 2 ? intToNumeral(indexInFullCollection + 1) : intToChar(indexInFullCollection + 1);
                const fullPathKey = `${parentKey}.${pathKey}`;
                return (
                  <SupportPath
                    key={supportPath.id}
                    character={pathKey}
                    pathFilterState={pathFilterState}
                    path={supportPath}
                    handleEdgeClick={handleEdgeClick}
                    handleNodeClick={handleNodeClick}
                    handleActivateEvidence={()=>handleActivateEvidence(supportPath, fullPathKey)}
                    selectedPaths={selectedPaths}
                    pathViewStyles={pathViewStyles}
                    activeEntityFilters={activeEntityFilters}
                    activeFilters={activeFilters}
                    pk={pk}
                    showHiddenPaths={showHiddenPaths}
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
                pageRangeDisplayed={4}
                marginPagesDisplayed={1}
                pageCount={pageCount}
                renderOnZeroPageCount={null}
                className='pageNums'
                pageClassName='pageNum'
                activeClassName='current'
                previousLinkClassName={`button ${styles.button}`}
                nextLinkClassName={`button ${styles.button}`}
                disabledLinkClassName={`disabled ${styles.disabled}`}
                forcePage={currentPage}
              />
            </div>
          }
        </SupportPathKeyContext.Provider>
      </SupportPathDepthContext.Provider>
    </AnimateHeight>
  )
}

export default SupportPathGroup;
