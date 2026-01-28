import styles from './PathView.module.scss';
import { useState, useMemo, useCallback, useRef, FC, Dispatch, SetStateAction, RefObject, createContext } from "react";
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import ReactPaginate from 'react-paginate';
import ChevLeft from '@/assets/icons/directional/Chevron/Chevron Left.svg?react';
import ChevRight from '@/assets/icons/directional/Chevron/Chevron Right.svg?react';
import Information from '@/assets/icons/status/Alerts/Info.svg?react';
import { isStringArray } from '@/features/Common/utils/utilities';
import { getFilteredPathCount, getIsPathFiltered, getPathsWithSelectionsSet, isPathInferred } from '@/features/ResultItem/utils/utilities';
import { PathFilterState, ResultNode, Path, ResultEdge, HoverTarget } from '@/features/ResultList/types/results';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { LastViewedPathIDContextType } from '@/features/ResultItem/hooks/resultHooks';
import { useHoverPathObject } from '@/features/Evidence/hooks/evidenceHooks';
import { getResultSetById, getPathsByIds } from '@/features/ResultList/slices/resultsSlice';
import { useSelector } from 'react-redux';
import Button from '@/features/Core/components/Button/Button';
import PathContainer from '@/features/ResultItem/components/PathContainer/PathContainer';

export const LastViewedPathIDContext = createContext<LastViewedPathIDContextType | undefined>(undefined);
export const SupportPathDepthContext = createContext<number>(1);
export const HoverContext = createContext<{
  hoveredItem: HoverTarget;
  setHoveredItem: (target: HoverTarget) => void;
} | null>(null);

interface PathViewProps {
  active: boolean;
  activeEntityFilters: string[];
  activeFilters: Filter[];
  compressedSubgraph?: false | (ResultEdge | ResultNode | ResultEdge[])[];
  handleActivateEvidence: (path: Path, pathKey: string) => void;
  handleEdgeSpecificEvidence:(edgeIDs: string[], path: Path, pathKey: string) => void;
  inModal?: boolean;
  isEven: boolean;
  pathArray: string[] | Path[];
  pathFilterState: PathFilterState;
  pk: string;
  resultID: string;
  selectedEdge?: ResultEdge | null;
  selectedEdgeRef?: RefObject<HTMLElement | null>;
  selectedPaths: Set<Path> | null;
  setShowHiddenPaths: Dispatch<SetStateAction<boolean>>;
  showHiddenPaths: boolean;
}

const PathView: FC<PathViewProps> = ({ 
  active,
  activeEntityFilters,
  activeFilters,
  compressedSubgraph,
  handleActivateEvidence,
  handleEdgeSpecificEvidence,
  inModal = false, 
  isEven,
  pathArray,
  pathFilterState,
  pk,
  resultID,
  selectedEdge,
  selectedEdgeRef,
  selectedPaths,
  setShowHiddenPaths,
  showHiddenPaths }) => {

  const resultSet = useSelector(getResultSetById(pk));
  const paths = useMemo(() => isStringArray(pathArray) ?  getPathsByIds(resultSet, pathArray) : pathArray, [pathArray, resultSet]);
  const itemsPerPage: number = 10;
  const formattedPaths = useMemo(() => getPathsWithSelectionsSet(resultSet, paths, pathFilterState, selectedPaths, true), [paths, selectedPaths, pathFilterState, resultSet]);
  const filteredPathCount = useMemo(() => getFilteredPathCount(formattedPaths, pathFilterState), [formattedPaths, pathFilterState]);
  const fullFilteredPathCount = useMemo(() => getFilteredPathCount(formattedPaths, pathFilterState, true, resultSet), [formattedPaths, pathFilterState, resultSet]);
  const [itemOffset, setItemOffset] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(0)
  const endResultIndex = useRef<number>(itemsPerPage);
  const pageCount = (!showHiddenPaths) ? Math.ceil((formattedPaths.length - filteredPathCount) / itemsPerPage) : Math.ceil((formattedPaths.length) / itemsPerPage);
  const [hoveredItem, setHoveredItem] = useState<HoverTarget>(null);
  const { hoveredIndex } = useHoverPathObject(setHoveredItem);
  
  const handlePageClick = (event: {selected: number} ) => {
    let pathsLength = formattedPaths.length;
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
  const formattedPathsToDisplay = (showHiddenPaths) ? formattedPaths : formattedPaths.filter(path => !getIsPathFiltered(path, pathFilterState));
  const displayedPaths = formattedPathsToDisplay.slice(itemOffset, endResultIndex.current);
  // Create the context with a default value of null
  const [lastViewedPathID, setLastViewedPathID] = useState<string|null>(null);

  let directLabelDisplayed = false;
  let inferredLabelDisplayed = false;

  const handleNodeClick = useCallback((name: ResultNode ) => {
    console.log("handle name click", name);
    if(Array.isArray(name.provenance) && name.provenance[0].length > 0 && name.provenance[0].includes("http"))
      window.open(name.provenance[0], '_blank');
  },[]);

  const handleEdgeClick = useCallback((edgeIDs: string[], path: Path, pathKey: string) => {
    setLastViewedPathID(path?.id || null);
    handleEdgeSpecificEvidence(edgeIDs, path, pathKey);
  }, [handleEdgeSpecificEvidence]);

  if(!resultSet)
    return null;

  return(
    <div className={styles.pathView}>
      <Tooltip id='paths-label-tooltip'>
        <span className={styles.inferredLabelTooltip}>Paths are composed of stepwise links for each result's key concepts. Select a path to explore publications and additional resources supporting each relationship.</span>
      </Tooltip>
      {
        !inModal && 
        <div className={styles.header}>
          <p>Hover over any entity to view a definition (if available), or click on any relationship to view evidence that supports it.</p>
        </div>
      }
      {
        (!active)
        ? <></>
        :
        <LastViewedPathIDContext.Provider value={{lastViewedPathID, setLastViewedPathID}}>
          <HoverContext.Provider value={{ hoveredItem, setHoveredItem }}>
            <SupportPathDepthContext.Provider value={0}>
              <div className={`${styles.paths} ${inModal && styles.inModal}`}>
                {
                  displayedPaths.map((path: Path, i: number)=> {
                    if(!path.id) 
                      return null;
                    const displayIndirectLabel = isPathInferred(resultSet, path) && !inferredLabelDisplayed;
                      if(displayIndirectLabel)
                        inferredLabelDisplayed = true;
                    const displayDirectLabel = !isPathInferred(resultSet, path) && !directLabelDisplayed;
                      if(displayDirectLabel)
                        directLabelDisplayed = true;
                                          return (
                        <div key={path.id || i.toString()}>
                        { displayDirectLabel && !inModal && (
                          <p className={styles.inferenceLabel} data-tooltip-id="direct-label-tooltip">
                            Direct <Information className={styles.infoIcon} />
                            <Tooltip id='direct-label-tooltip'>
                              <span className={styles.inferredLabelTooltip}>Established from explicit evidence in external sources. Example: A research paper stating 'X is related to Y.'</span>
                            </Tooltip>
                          </p>
                        )}
                        { displayIndirectLabel && !inModal && (
                          <p className={styles.inferenceLabel} data-tooltip-id="inferred-label-tooltip">
                            Indirect <Information className={styles.infoIcon} />
                            <Tooltip id='inferred-label-tooltip'>
                              <span className={styles.inferredLabelTooltip}>Indirect paths are identified by reasoning agents that use logic and pattern recognition to find connections between objects. The intermediary connections that explain these relationships can be found in the supporting paths below them. <a href="/help#indirect" target='_blank'>Learn More about Indirect Paths</a></span>
                            </Tooltip>
                          </p>
                        )}
                        <PathContainer
                          key={path.id}
                          lastViewedPathID={lastViewedPathID}
                          setLastViewedPathID={setLastViewedPathID}
                          path={path}
                          inModal={inModal}
                          compressedSubgraph={compressedSubgraph}
                          handleActivateEvidence={handleActivateEvidence}
                          handleEdgeClick={handleEdgeClick}
                          handleNodeClick={handleNodeClick}
                          activeEntityFilters={activeEntityFilters}
                          selectedPaths={selectedPaths}
                          pathFilterState={pathFilterState}
                          activeFilters={activeFilters}
                          pk={pk}
                          showHiddenPaths={showHiddenPaths}
                          selectedEdgeRef={selectedEdgeRef}
                          selectedEdge={selectedEdge}
                          isEven={isEven}
                          hoveredIndex={hoveredIndex}
                          styles={styles}
                          formattedPaths={formattedPaths}
                        />
                      </div>
                    )
                  })
                }
              </div>
              {
                Object.keys(activeFilters).length > 0 && fullFilteredPathCount > 0 && 
                <Button
                  handleClick={()=>{setShowHiddenPaths(prev=>!prev); handlePageClick({selected: 0})}}
                  variant="secondary"
                  small
                  dataTooltipId={`${resultID}-excluded-paths-toggle`}
                  className={`${!!isEven && styles.evenButton}`}
                  iconRight={<Information/>}
                  >
                  {showHiddenPaths ? `Hide ${fullFilteredPathCount} Excluded Paths` : `Show ${fullFilteredPathCount} Excluded Paths`}
                  <Tooltip id={`${resultID}-excluded-paths-toggle`}>
                    {
                      showHiddenPaths 
                      ? <span>Some paths that are a part of this result are excluded from this list due to applied filters. Click to hide these excluded paths.</span>
                      : <span>Some paths that are a part of this result are excluded from this list due to applied filters. Click to view these excluded paths.</span>
                    }
                  </Tooltip>
                </Button>
              }
            </SupportPathDepthContext.Provider>
          </HoverContext.Provider>
        </LastViewedPathIDContext.Provider>
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
