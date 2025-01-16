import styles from './PathView.module.scss';
import { useState, useMemo, useCallback, useRef, createContext, FC, Dispatch, SetStateAction } from "react";
import Tooltip from '../Tooltip/Tooltip';
import ReactPaginate from 'react-paginate';
import ChevLeft from '../../Icons/Directional/Chevron/Chevron Left.svg?react';
import ChevRight from '../../Icons/Directional/Chevron/Chevron Right.svg?react';
import Information from '../../Icons/Status/Alerts/Info.svg?react';
import ResearchMultiple from '../../Icons/Queries/Evidence.svg?react';
import { getFilteredPathCount, getPathsWithSelectionsSet, isPathInferred, isStringArray, numberToWords } from '../../Utilities/utilities';
import { PathFilterState, ResultNode, Path, ResultSet, Filter } from '../../Types/results';
import { LastViewedPathIDContextType } from '../../Utilities/customHooks';
import { getResultSetById, getPathsByIds } from '../../Redux/resultsSlice';
import { useSelector } from 'react-redux';
import PathObject from '../PathObject/PathObject';
import Button from '../Core/Button';

export const LastViewedPathIDContext = createContext<LastViewedPathIDContextType | undefined>(undefined);

const sortArrayByIndirect = (resultSet: ResultSet | null, paths: Path[]) => {
  if(!resultSet)
    return paths;
  return paths.sort((a, b) => {
      let inferredA =  isPathInferred(resultSet, a) ? 1 : 0;
      let inferredB = isPathInferred(resultSet, b) ? 1 : 0;
      return inferredA - inferredB;
  });
}

interface PathViewProps {
  active: boolean;
  activeEntityFilters: string[];
  activeFilters: Filter[];
  isEven: boolean;
  handleActivateEvidence: (path: Path) => void;
  handleEdgeSpecificEvidence:(edgeID: string, path: Path) => void;
  pathArray: string[] | Path[];
  pathFilterState: PathFilterState;
  pk: string;
  selectedPaths: Set<Path> | null;
  setShowHiddenPaths: Dispatch<SetStateAction<boolean>>;
  showHiddenPaths: boolean;
}

const PathView: FC<PathViewProps> = ({ 
  active, 
  activeEntityFilters, 
  activeFilters, 
  handleActivateEvidence, 
  handleEdgeSpecificEvidence, 
  isEven, 
  pathArray, 
  pathFilterState,
  pk,
  selectedPaths, 
  setShowHiddenPaths,
  showHiddenPaths }) => {

  const resultSet = useSelector(getResultSetById(pk));
  const paths = isStringArray(pathArray) ?  getPathsByIds(resultSet, pathArray) : pathArray;
  const itemsPerPage: number = 10;
  const formattedPaths = useMemo(() => getPathsWithSelectionsSet(resultSet, paths, pathFilterState, selectedPaths), [paths, selectedPaths, pathFilterState, resultSet]);
  const filteredPathCount = getFilteredPathCount(formattedPaths, pathFilterState);
  const [itemOffset, setItemOffset] = useState<number>(0);
  const currentPage = useRef<number>(0);
  const endResultIndex = useRef<number>(itemsPerPage);
  const pageCount = (!!formattedPaths) ? Math.ceil((formattedPaths.length - filteredPathCount) / itemsPerPage) : 0;
  
  const handlePageClick = (event: {selected: number} ) => {
    let pathsLength = formattedPaths.length;
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

  const displayedPaths = sortArrayByIndirect(resultSet, formattedPaths).slice(itemOffset, endResultIndex.current);
  // Create the context with a default value of null
  const [lastViewedPathID, setLastViewedPathID] = useState<string|null>(null);

  let directLabelDisplayed = false;
  let inferredLabelDisplayed = false;

  const handleNodeClick = useCallback((name: ResultNode ) => {
    console.log("handle name click", name);
    if(Array.isArray(name.provenance) && name.provenance[0].length > 0 && name.provenance[0].includes("http"))
      window.open(name.provenance[0], '_blank');
  },[]);

  const handleEdgeClick = useCallback((edgeID: string, path: Path) => {
    setLastViewedPathID(path?.id || null);
    handleEdgeSpecificEvidence(edgeID, path);
  }, [handleEdgeSpecificEvidence]);

  if(!resultSet)
    return null;

  return(
    <div className={styles.pathView}>
      <Tooltip id='paths-label-tooltip'>
        <span className={styles.inferredLabelTooltip}>Paths are composed of stepwise links for each result's key concepts. Select a path to explore publications and additional resources supporting each relationship.</span>
      </Tooltip>
      <Tooltip id='direct-label-tooltip'>
        <span className={styles.inferredLabelTooltip}>Established from explicit evidence in external sources. Example: A research paper stating 'X is related to Y.'</span>
      </Tooltip>
      <Tooltip id='inferred-label-tooltip'>
        <span className={styles.inferredLabelTooltip}>Deduced from patterns in Translator's knowledge graphs that suggest relationships which are not explicitly stated. The paths shown below them support the inferred relationship.</span>
      </Tooltip>
      <div className={styles.header}>
        <p>Hover over any entity to view a definition (if available), or click on any relationship to view evidence that supports it.</p>
      </div>
      {
        (!active)
        ? <></>
        :
        <LastViewedPathIDContext.Provider value={{lastViewedPathID, setLastViewedPathID}}>
          <div className={styles.paths}>
            {
              displayedPaths.map((pathToDisplay: Path, i: number)=> {
                const isPathFiltered = (!!pathFilterState && pathToDisplay?.id) ? pathFilterState[pathToDisplay.id] : false;
                if(!pathToDisplay.id || (isPathFiltered && !showHiddenPaths)) 
                  return null;
                const displayIndirectLabel = isPathInferred(resultSet, pathToDisplay) && !inferredLabelDisplayed;
                  if(displayIndirectLabel)
                    inferredLabelDisplayed = true;
                const displayDirectLabel = !isPathInferred(resultSet, pathToDisplay) && !directLabelDisplayed;
                  if(displayDirectLabel)
                    directLabelDisplayed = true;
                const tooltipID: string = (!!pathToDisplay?.id) ? pathToDisplay.id : i.toString();
                const indexInFullCollection = (!!formattedPaths) ? formattedPaths.findIndex(item => item.id === pathToDisplay.id) : -1;

                return (
                  <div key={tooltipID}>
                    {
                      displayDirectLabel
                        ?
                          <p className={styles.inferenceLabel} data-tooltip-id="direct-label-tooltip">
                            Direct <Information className={styles.infoIcon} />
                          </p>
                        :
                          null
                    }
                    {
                      displayIndirectLabel
                        ?
                          <>
                            <p className={styles.inferenceLabel} data-tooltip-id="inferred-label-tooltip" >
                              Indirect <Information className={styles.infoIcon} />
                            </p>
                          </>
                        : null
                      }
                    <div className={styles.formattedPath} >
                      <span className={styles.num}>
                        { indexInFullCollection + 1 }
                      </span>
                      <button
                        onClick={()=>(pathToDisplay.id) ? handleActivateEvidence(pathToDisplay) : null}
                        className={styles.pathEvidenceButton}
                        data-tooltip-id={tooltipID}
                        >
                          <ResearchMultiple />
                      </button>
                      <Tooltip
                        id={tooltipID}
                        >
                          <span>View evidence for this path.</span>
                      </Tooltip>
                      <div className={`${styles.tableItem} path ${numberToWords(pathToDisplay.subgraph.length)} ${selectedPaths !== null && selectedPaths.size > 0 && !pathToDisplay.highlighted ? styles.unhighlighted : ''} ${isPathFiltered ? styles.filtered : ''}`} >
                        {
                          !!pathToDisplay?.compressedSubgraph
                          ?
                            pathToDisplay.compressedSubgraph.map((subgraphItemID, i) => {
                              let key = (Array.isArray(subgraphItemID)) ? subgraphItemID[0] : subgraphItemID;
                              if(pathToDisplay.id === undefined)
                                return null;
                              return (
                                <>
                                  <PathObject
                                    pathViewStyles={styles}
                                    index={i}
                                    isEven={isEven}
                                    path={pathToDisplay}
                                    id={subgraphItemID}
                                    key={key}
                                    handleActivateEvidence={handleActivateEvidence}
                                    handleEdgeClick={handleEdgeClick}
                                    handleNodeClick={handleNodeClick}
                                    activeEntityFilters={activeEntityFilters}
                                    selectedPaths={selectedPaths}
                                    pathFilterState={pathFilterState}
                                    activeFilters={activeFilters}
                                    pk={pk}
                                    showHiddenPaths={showHiddenPaths}
                                  />
                                </>
                              )
                            }) 
                          :
                            pathToDisplay.subgraph.map((subgraphItemID, i) => {
                              if(pathToDisplay.id === undefined)
                                return null;
                              return (
                                <>
                                  <PathObject
                                    pathViewStyles={styles}
                                    index={i}
                                    isEven={isEven}
                                    path={pathToDisplay}
                                    id={subgraphItemID}
                                    key={subgraphItemID}
                                    handleActivateEvidence={handleActivateEvidence}
                                    handleEdgeClick={handleEdgeClick}
                                    handleNodeClick={handleNodeClick}
                                    activeEntityFilters={activeEntityFilters}
                                    selectedPaths={selectedPaths}
                                    pathFilterState={pathFilterState}
                                    activeFilters={activeFilters}
                                    pk={pk}
                                    showHiddenPaths={showHiddenPaths}
                                  />
                                </>
                              )
                            })
                        }
                      </div>
                    </div>
                  </div>
                )
              })
            }
          </div>
          {
            Object.keys(activeFilters).length > 0 &&
            <Button handleClick={()=>setShowHiddenPaths(prev=>!prev)}>{showHiddenPaths ? "Hide Excluded Paths" : "Show Excluded Paths"}</Button>
          }
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
            forcePage={currentPage.current}
          />
        </div>
      }
    </div>
  )
}

export default PathView;
