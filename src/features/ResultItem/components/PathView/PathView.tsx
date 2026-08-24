import styles from './PathView.module.scss';
import { useMemo, useCallback, useEffect, FC, Dispatch, SetStateAction, RefObject, createContext, useState } from "react";
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import ReactPaginate from 'react-paginate';
import ChevLeft from '@/assets/icons/directional/Chevron/Chevron Left.svg?react';
import ChevRight from '@/assets/icons/directional/Chevron/Chevron Right.svg?react';
import Information from '@/assets/icons/status/Alerts/Info.svg?react';
import { isStringArray } from '@/features/Core/utils/resultHelpers';
import { getIsPathFiltered, getPathsPerPage, getFormattedPaths } from '@/features/ResultItem/utils/utilities';
import { PathFilterState, ResultNode, Path, ResultEdge } from '@/features/ResultList/types/results';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { createHoverStore, HoverContext } from '@/features/ResultItem/hooks/hoverHooks';
import { getResultSetById, getPathsByIds } from '@/features/ResultList/slices/resultsSlice';
import { selectActiveCanvas } from '@/features/Canvas/slices/canvasSlice';
import { useSelector } from 'react-redux';
import Button from '@/features/Core/components/Button/Button';
import PathContainer from '@/features/ResultItem/components/PathContainer/PathContainer';
import { useResultListContext } from '@/features/ResultList/context/ResultListContext';
import { currentPrefs } from '@/features/UserAuth/slices/userSlice';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import { EMPTY_STRING_ARRAY, noop } from '@/features/Core/utils/constants';
import { useDragActiveRef } from '@/features/DragAndDrop/hooks/useDragActiveRef';

// Supplies the id of the result this PathView belongs to, so node/edge navigation
// works even when the route has no result id (e.g. the results list view).
export const ResultItemIdContext = createContext<string | undefined>(undefined);

// Stable defaults for callers that have nothing to filter by, so memoized
// descendants aren't invalidated by a fresh literal on every render.
const NO_FILTERS: Filter[] = [];
const NO_PATH_FILTER_STATE: PathFilterState = {};

interface PathViewProps {
  active: boolean;
  activeEntityFilters?: string[];
  activeFilters?: Filter[];
  compressedSubgraph?: false | (ResultEdge | ResultNode | ResultEdge[])[];
  handleEdgeSpecificEvidence?:(edgeIDs: string[], path: Path) => void;
  inModal?: boolean;
  isEven: boolean;
  isLookup?: boolean;
  pathArray: string[] | Path[];
  pathFilterState?: PathFilterState;
  pk: string;
  resultId?: string;
  selectedEdge?: ResultEdge | null;
  selectedEdgeRef?: RefObject<HTMLElement | null>;
  setShowHiddenPaths?: Dispatch<SetStateAction<boolean>>;
  showHiddenPaths: boolean;
}

const PathView: FC<PathViewProps> = ({ 
  active,
  activeEntityFilters = EMPTY_STRING_ARRAY,
  activeFilters = NO_FILTERS,
  compressedSubgraph,
  handleEdgeSpecificEvidence,
  inModal = false,
  isEven,
  isLookup = false,
  pathArray,
  pathFilterState = NO_PATH_FILTER_STATE,
  pk,
  resultId: resultItemId,
  selectedEdge,
  selectedEdgeRef,
  setShowHiddenPaths = noop,
  showHiddenPaths }) => {
  
  const prefs = useSelector(currentPrefs);
  const hasActiveCanvas = !!useSelector(selectActiveCanvas);
  const { resultId } = useResultListContext();
  const effectiveResultId = resultItemId ?? resultId;
  const resultSet = useSelector(getResultSetById(pk));
  const paths = useMemo(() => isStringArray(pathArray) ?  getPathsByIds(resultSet, pathArray) : pathArray, [pathArray, resultSet]);
  const pathsPerPage: number = getPathsPerPage(prefs);
  const formattedPaths = useMemo(() => getFormattedPaths(resultSet, paths, pathFilterState), [paths, pathFilterState, resultSet]);
  const [itemOffset, setItemOffset] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hoverStore] = useState(createHoverStore);
  // Clearing on both edges of a drag avoids leaving a stale highlight behind,
  // since the hover handlers themselves are inert while dragging.
  const handleDragActiveChange = useCallback(() => hoverStore.setHoveredItem(null), [hoverStore]);
  const isDragActiveRef = useDragActiveRef(handleDragActiveChange);
  const hoverContextValue = useMemo(
    () => ({ store: hoverStore, isDragActiveRef }),
    [hoverStore, isDragActiveRef]
  );

  // Path numbering is based on position in the full collection. Building the lookup
  // once here keeps each PathContainer from scanning the whole array.
  const pathIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    formattedPaths.forEach((path, index) => {
      if (path.id) map.set(path.id, index);
    });
    return map;
  }, [formattedPaths]);
  
  const { formattedPathsToDisplay, filteredPathCount } = useMemo(() => {
    let filteredCount = 0;
    const visible = formattedPaths.filter(path => {
      const isFiltered = getIsPathFiltered(path, pathFilterState);
      if (isFiltered) filteredCount++;
      return !isFiltered;
    });
    return {
      formattedPathsToDisplay: showHiddenPaths ? formattedPaths : visible,
      filteredPathCount: filteredCount
    };
  }, [formattedPaths, pathFilterState, showHiddenPaths]);

  const hasFilteredPaths = filteredPathCount > 0;
  const pageCount = Math.ceil(formattedPathsToDisplay.length / pathsPerPage);
  const displayedPaths = formattedPathsToDisplay.slice(itemOffset, itemOffset + pathsPerPage);

  useEffect(() => {
    setCurrentPage(0);
    setItemOffset(0);
  }, [pathsPerPage]);

  const handlePageClick = useCallback((event: {selected: number}) => {
    const pathsLength = formattedPathsToDisplay.length;
    if (!pathsLength)
      return;
    setCurrentPage(event.selected);
    const newOffset = (event.selected * pathsPerPage) % pathsLength;
    setItemOffset(isNaN(newOffset) ? 0 : newOffset);
  }, [formattedPathsToDisplay.length, pathsPerPage]);

  const handleEdgeClick = useCallback((edgeIDs: string[], path: Path) => {
    handleEdgeSpecificEvidence?.(edgeIDs, path);
  }, [handleEdgeSpecificEvidence]);

  if(!resultSet)
    return null;

  return(
    <div className={styles.pathView}>
      <Tooltip id='paths-label-tooltip'>
        <span className={styles.inferredLabelTooltip}>Paths are composed of stepwise links for each result's key concepts. Select a path to explore publications and additional resources supporting each relationship.</span>
      </Tooltip>
      {
        (!inModal && !isLookup) && 
        <div className={styles.header}>
          <p>
            {hasActiveCanvas
              ? 'Drag and drop a result, path, object, or relationship to add it to the canvas.'
              : 'Hover over any entity to view a definition (if available), or click on any relationship to view evidence that supports it.'}
          </p>
        </div>
      }
      {
        (!active)
        ? <></>
        :
        <ResultItemIdContext.Provider value={effectiveResultId}>
        <HoverContext.Provider value={hoverContextValue}>
            <div className={joinClasses(styles.paths, inModal && styles.inModal)}>
              {
                displayedPaths.map((path: Path, i: number)=> {
                  if(!path.id) 
                    return null;
                  return (
                    <div key={path.id || i.toString()}>
                      <PathContainer
                        key={path.id}
                        path={path}
                        inModal={inModal}
                        compressedSubgraph={compressedSubgraph}
                        handleEdgeClick={handleEdgeClick}
                        activeEntityFilters={activeEntityFilters}
                        pathFilterState={pathFilterState}
                        pk={pk}
                        showHiddenPaths={showHiddenPaths}
                        selectedEdgeRef={selectedEdgeRef}
                        selectedEdge={selectedEdge}
                        isEven={isEven}
                        styles={styles}
                        pathIndex={pathIndexMap.get(path.id) ?? -1}
                      />
                    </div>
                  )
                })
              }
            </div>
            {
              Object.keys(activeFilters).length > 0 && hasFilteredPaths && 
              <Button
                handleClick={() => { setShowHiddenPaths(prev => !prev); setCurrentPage(0); setItemOffset(0); }}                variant="secondary"
                small
                dataTooltipId={`${effectiveResultId}-excluded-paths-toggle`}
                className={joinClasses(isEven && styles.evenButton)}
                iconRight={<Information/>}
                >
                {showHiddenPaths ? `Hide ${filteredPathCount} Excluded Paths` : `Show ${filteredPathCount} Excluded Paths`}
                <Tooltip id={`${effectiveResultId}-excluded-paths-toggle`}>
                  {
                    showHiddenPaths 
                    ? <span>Some paths that are a part of this result are excluded from this list due to applied filters. Click to hide these excluded paths.</span>
                    : <span>Some paths that are a part of this result are excluded from this list due to applied filters. Click to view these excluded paths.</span>
                  }
                </Tooltip>
              </Button>
            }
        </HoverContext.Provider>
        </ResultItemIdContext.Provider>
      }
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
    </div>
  )
}

export default PathView;
