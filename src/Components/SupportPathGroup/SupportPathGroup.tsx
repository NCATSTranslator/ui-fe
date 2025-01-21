import { useState, useEffect, FC, useRef, useMemo } from 'react';
import styles from './SupportPathGroup.module.scss';
import SupportPath from '../SupportPath/SupportPath';
import AnimateHeight from '../AnimateHeight/AnimateHeight';
import ReactPaginate from 'react-paginate';
import ChevLeft from '../../Icons/Directional/Chevron/Chevron Left.svg?react';
import ChevRight from '../../Icons/Directional/Chevron/Chevron Right.svg?react';
import { sortSupportByEntityStrings, sortSupportByLength } from '../../Utilities/sortingFunctions';
import { Filter, Path, PathFilterState, ResultNode } from '../../Types/results';
import { intToChar, getPathsWithSelectionsSet, isStringArray, getFilteredPathCount } from '../../Utilities/utilities';
import { useSelector } from 'react-redux';
import { getResultSetById, getPathsByIds } from '../../Redux/resultsSlice';

interface SupportPathGroupProps {
  activeFilters: Filter[];
  activeEntityFilters: string[];
  handleActivateEvidence: (path: Path) => void;
  handleEdgeClick: (edgeIDs: string[], path: Path) => void;
  handleNodeClick: (name: ResultNode) => void;
  isExpanded: boolean;
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
  pathFilterState, 
  pathArray, 
  pathViewStyles, 
  pk,
  selectedPaths,
  showHiddenPaths }) => {

  const resultSet = useSelector(getResultSetById(pk));
  const paths = isStringArray(pathArray) ? getPathsByIds(resultSet, pathArray) : pathArray;

  const formattedPaths = useMemo(() => getPathsWithSelectionsSet(resultSet, paths, pathFilterState, selectedPaths), [paths, selectedPaths, pathFilterState, resultSet]);

  const initHeight = (isExpanded) ? 'auto' : 0;
  const [height, setHeight] = useState<number | string>(initHeight);

  const filteredPathCount = getFilteredPathCount(formattedPaths, pathFilterState);
  const itemsPerPage: number = 10;
  const [itemOffset, setItemOffset] = useState<number>(0);
  const currentPage = useRef<number>(0);
  const endResultIndex = useRef<number>(itemsPerPage);
  const pageCount = (!!formattedPaths) ? Math.ceil((formattedPaths.length - filteredPathCount) / itemsPerPage) : 0;
  
  const handlePageClick = (event: {selected: number} ) => {
    let pathsLength = pathArray.length;
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

  const displayedPaths = (!!formattedPaths) 
    ? formattedPaths.sort((a, b) => Number(b?.highlighted) - Number(a?.highlighted)).slice(itemOffset, endResultIndex.current)
    : [];

  useEffect(() => {
    if(isExpanded === false)
      setHeight(0);
    else
      setHeight('auto');
  }, [isExpanded])

  useEffect(() => {
    // if there are any active string filters, sort by those
    if(activeEntityFilters.length > 0 && !!formattedPaths && !!resultSet) {
      sortSupportByEntityStrings(resultSet, formattedPaths, activeEntityFilters);
    // otherwise sort by shortest path length first
    } else {
      sortSupportByLength(formattedPaths);
    }
  }, [pathArray, activeEntityFilters, formattedPaths, resultSet]);

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
          displayedPaths.map((supportPath, i) => {
            if(!supportPath)
              return null;
            const indexInFullCollection = itemOffset + i;
            const character = intToChar(indexInFullCollection + 1);
            return (
              <SupportPath
                key={supportPath.id}
                character={character}
                pathFilterState={pathFilterState}
                path={supportPath}
                handleEdgeClick={handleEdgeClick}
                handleNodeClick={handleNodeClick}
                handleActivateEvidence={handleActivateEvidence}
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
            forcePage={currentPage.current}
          />
        </div>
      }
    </AnimateHeight>
  )
}

export default SupportPathGroup;
