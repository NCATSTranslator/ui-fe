import styles from './PathView.module.scss';
import { useState, useMemo, useCallback, useRef, createContext, FC, Dispatch, SetStateAction } from "react";
import Tooltip from '../Tooltip/Tooltip';
import ReactPaginate from 'react-paginate';
import ChevLeft from '../../Icons/Directional/Chevron/Chevron Left.svg?react';
import ChevRight from '../../Icons/Directional/Chevron/Chevron Right.svg?react';
import Information from '../../Icons/Status/Alerts/Info.svg?react';
import ResearchMultiple from '../../Icons/Queries/Evidence.svg?react';
import PathArrow from '../../Icons/Connectors/PathArrow.svg?react';
import { getFilteredPathCount, getIsPathFiltered, getPathsWithSelectionsSet, isPathInferred, isStringArray, numberToWords } from '../../Utilities/utilities';
import { PathFilterState, ResultNode, Path, Filter, ResultEdge } from '../../Types/results';
import { LastViewedPathIDContextType, useHoveredIndex } from '../../Utilities/customHooks';
import { getResultSetById, getPathsByIds } from '../../Redux/slices/resultsSlice';
import { useSelector } from 'react-redux';
import PathObject from '../PathObject/PathObject';
import Button from '../Core/Button';
import LastViewedTag from '../LastViewedTag/LastViewedTag';

export const LastViewedPathIDContext = createContext<LastViewedPathIDContextType | undefined>(undefined);
export const SupportPathDepthContext = createContext<number>(1);

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
  selectedPaths,
  setShowHiddenPaths,
  showHiddenPaths }) => {

  const resultSet = useSelector(getResultSetById(pk));
  const paths = isStringArray(pathArray) ?  getPathsByIds(resultSet, pathArray) : pathArray;
  const itemsPerPage: number = 10;
  const formattedPaths = useMemo(() => getPathsWithSelectionsSet(resultSet, paths, pathFilterState, selectedPaths, true), [paths, selectedPaths, pathFilterState, resultSet]);
  const filteredPathCount = getFilteredPathCount(formattedPaths, pathFilterState);
  const [itemOffset, setItemOffset] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(0)
  const endResultIndex = useRef<number>(itemsPerPage);
  const pageCount = (!showHiddenPaths) ? Math.ceil((formattedPaths.length - filteredPathCount) / itemsPerPage) : Math.ceil((formattedPaths.length) / itemsPerPage);
  
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
  const { hoveredIndex, getHoverHandlers } = useHoveredIndex();

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

  const edgeHeight = 32;
  const svgWidth = 198;
  const curveOffset = 50;
  const straightSegmentLength = 20;
  const pathColor = "#8C8C8C26";
  const hoveredPathColor = "#6A5C8259";
  const selectedPathColor = "#5D4E778C";
  const hoveredSelectedPathColor = "#3F2E5E59";
  const pathThickness = 32;

  const getStrokeColor = (index: number, hoveredIndex: number | null, selected: boolean) => {
    const hovered = hoveredIndex !== null && hoveredIndex === index;
    if(hovered && selected)
      return hoveredSelectedPathColor;
    if(hovered)
      return hoveredPathColor;
    if(selected)
      return selectedPathColor;

    return pathColor;
  }
  
  const generatePathD = (
    index: number,
    svgHeight: number,
    svgWidth: number,
    edgeHeight: number,
    enter: boolean,
    curveOffset = 50,
    straightSegment = 10
  ): string => {
    const startX = 0; 
    const startY = svgHeight * 0.5;
    const endX = svgWidth; 
    // Center of stacked edge
    const endY = index * (edgeHeight + 8) + edgeHeight / 2; 
    // Adjust straight segment positions
    const midStartX = startX + straightSegment;
    const midEndX = endX - straightSegment;
    // Control points for smooth curves
    const controlX1 = midStartX + curveOffset;
    const controlX2 = midEndX - curveOffset;
  
    return enter 
      ? `M ${startX} ${startY} 
         L ${midStartX} ${startY} 
         C ${controlX1} ${startY}, ${controlX2} ${endY}, ${midEndX} ${endY} 
         L ${endX} ${endY}`
      : `M ${startX} ${endY} 
         L ${midStartX} ${endY} 
         C ${controlX1} ${endY}, ${controlX2} ${startY}, ${midEndX} ${startY} 
         L ${endX} ${startY}`;
  };

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
          <SupportPathDepthContext.Provider value={0}>
            <div className={`${styles.paths} ${inModal && styles.inModal}`}>
              {
                displayedPaths.map((path: Path, i: number)=> {
                  const isPathFiltered = getIsPathFiltered(path, pathFilterState);
                  if(!path.id || (isPathFiltered && !showHiddenPaths)) 
                    return null;
                  const displayIndirectLabel = isPathInferred(resultSet, path) && !inferredLabelDisplayed;
                    if(displayIndirectLabel)
                      inferredLabelDisplayed = true;
                  const displayDirectLabel = !isPathInferred(resultSet, path) && !directLabelDisplayed;
                    if(displayDirectLabel)
                      directLabelDisplayed = true;
                  const tooltipID: string = (!!path?.id) ? path.id : i.toString();
                  const indexInFullCollection = (!!formattedPaths) ? formattedPaths.findIndex(item => item.id === path.id) : -1;
                  const subgraphToMap = (!!path.compressedSubgraph && path.compressedSubgraph.length > 0) ? path.compressedSubgraph : path.subgraph;
                  return (
                    <div key={tooltipID}>
                      {
                        displayDirectLabel && !inModal
                          ?
                            <p className={styles.inferenceLabel} data-tooltip-id="direct-label-tooltip">
                              Direct <Information className={styles.infoIcon} />
                              <Tooltip id='direct-label-tooltip'>
                                <span className={styles.inferredLabelTooltip}>Established from explicit evidence in external sources. Example: A research paper stating 'X is related to Y.'</span>
                              </Tooltip>
                            </p>
                          :
                            null
                      }
                      {
                        displayIndirectLabel && !inModal
                          ?
                            <>
                              <p className={styles.inferenceLabel} data-tooltip-id="inferred-label-tooltip" >
                                Indirect <Information className={styles.infoIcon} />
                                <Tooltip id='inferred-label-tooltip'>
                                  <span className={styles.inferredLabelTooltip}>Indirect paths are identified by reasoning agents that use logic and pattern recognition to find connections between objects. The intermediary connections that explain these relationships can be found in the supporting paths below them. <a href="/help#indirect" target='_blank'>Learn More about Indirect Paths</a></span>
                                </Tooltip>
                              </p>
                            </>
                          : null
                        }
                      <div className={`${styles.formattedPath} ${!!lastViewedPathID && lastViewedPathID === path.id && styles.lastViewed} ${isEven && styles.isEven} ${isPathFiltered && styles.filtered}`}>
                        {
                          ((!!lastViewedPathID && lastViewedPathID === path.id) || inModal) &&
                          <LastViewedTag inModal={inModal} inGroup={!!(inModal && compressedSubgraph)}/>
                        }
                        <button
                          onClick={()=>{
                            if(!!path?.id) {
                              setLastViewedPathID(path.id);
                              handleActivateEvidence(path, (indexInFullCollection + 1).toString());
                            }
                          }}
                          className={styles.pathEvidenceButton}
                          data-tooltip-id={tooltipID}
                          >
                            <div className={styles.icon}>
                              <ResearchMultiple />
                            </div>
                            <span className={styles.num}>
                              <span className={styles.val}>
                                { indexInFullCollection + 1 }
                              </span>
                              <PathArrow/>
                            </span>
                        </button>
                        <Tooltip
                          id={tooltipID}
                          >
                            <span>View evidence for this path.</span>
                        </Tooltip>
                        <div 
                          data-path-id={`${path.id || ""}`} 
                          className={` ${inModal && compressedSubgraph && styles.compressedTableItem} ${styles.tableItem} path ${numberToWords(path.subgraph.length)} ${selectedPaths !== null && selectedPaths.size > 0 && !path.highlighted ? styles.unhighlighted : ''}`}
                          >
                          {
                            inModal && compressedSubgraph
                            ?
                              compressedSubgraph.map((subgraphItem, i) => {
                                if(Array.isArray(subgraphItem) && subgraphItem.length > 1) {
                                  const svgHeight = (subgraphItem.length * (edgeHeight + 8)) - 8;
                                  let hasSelected = (!!selectedEdge && subgraphItem.find(edge => edge.id === selectedEdge.id)) ? true : false; 
                                  return(
                                    <>
                                      <svg width={svgWidth} height={svgHeight} className={styles.connectors}>
                                        {/* Render node → edge connections */}
                                        {subgraphItem.map((edge, index) => {
                                          let selected = (!!selectedEdge && selectedEdge.id === edge.id) ? true : false;
                                          let strokeColor = getStrokeColor(index, hoveredIndex, selected);
                                          return (
                                            <path
                                              key={`node-to-edge-${edge.id}`}
                                              d={generatePathD(index, svgHeight, svgWidth, edgeHeight, true, curveOffset, straightSegmentLength)}
                                              stroke={strokeColor}
                                              fill="transparent"
                                              strokeWidth={pathThickness}
                                            />
                                          );
                                        })}
                                      </svg>
                                      <div className={`${styles.groupedPreds} ${hasSelected && styles.hasSelected}`}>
                                        {
                                          subgraphItem.map((edge, j)=> {
                                            let key = `${edge.id}`;
                                            let selected = (!!selectedEdge && selectedEdge.id === edge.id) ? true : false;
                                            return (
                                              <PathObject
                                                pathViewStyles={styles}
                                                index={i}
                                                isEven={false}
                                                path={path}
                                                parentPathKey={(indexInFullCollection + 1).toString()}
                                                id={edge.id}
                                                key={key}
                                                handleNodeClick={()=>{console.log("evidence modal node clicked!")}}
                                                handleEdgeClick={handleEdgeClick}
                                                pathFilterState={{}}
                                                activeFilters={[]}
                                                activeEntityFilters={[]}
                                                selected={selected}
                                                selectedPaths={null}
                                                inModal={true}
                                                pk={pk}
                                                hoverHandlers={getHoverHandlers(j)}
                                              />
                                            )
                                          })
                                        }
                                      </div>
                                      <svg width={svgWidth} height={svgHeight} className={styles.connectors}>
                                        {/* Render edge → node connections */}
                                        {subgraphItem.map((edge, index) => {
                                          let selected = (!!selectedEdge && selectedEdge.id === edge.id) ? true : false; 
                                          let strokeColor = getStrokeColor(index, hoveredIndex, selected);
                                          return (
                                            <path
                                              key={`edge-to-node-${edge.id}`}
                                              d={generatePathD(index, svgHeight, svgWidth, edgeHeight, false, curveOffset, straightSegmentLength)}
                                              stroke={strokeColor}
                                              fill="transparent"
                                              strokeWidth={pathThickness}
                                            />
                                          );
                                        })}
                                      </svg>
                                    </>
                                  )
                                } else {
                                  let key = (Array.isArray(subgraphItem)) ? subgraphItem[0].id : subgraphItem.id;
                                  let selected = (!!selectedEdge && selectedEdge.id === key) ? true : false; 
                                  return (
                                    <PathObject
                                      pathViewStyles={styles}
                                      index={i}
                                      isEven={false}
                                      path={path}
                                      parentPathKey={(indexInFullCollection + 1).toString()}
                                      id={key}
                                      key={key}
                                      handleNodeClick={()=>{console.log("evidence modal node clicked!")}}
                                      handleEdgeClick={handleEdgeClick}
                                      pathFilterState={{}}
                                      activeFilters={[]}
                                      activeEntityFilters={[]}
                                      selected={selected}
                                      selectedPaths={null}
                                      inModal={true}
                                      pk={pk}
                                    />
                                  )
                                }
                              }) 
                            :
                              subgraphToMap.map((subgraphItemID, i) => {
                                let selected = (!!selectedEdge && selectedEdge.id === subgraphItemID) ? true : false;
                                let key = (Array.isArray(subgraphItemID)) ? subgraphItemID[0] : subgraphItemID;
                                if(path.id === undefined)
                                  return null;
                                return (
                                  <>
                                    <PathObject
                                      pathViewStyles={styles}
                                      index={i}
                                      isEven={isEven}
                                      inModal={inModal}
                                      path={path}
                                      parentPathKey={(indexInFullCollection + 1).toString()}
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
                                      selected={selected}
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
              Object.keys(activeFilters).length > 0 && filteredPathCount > 0 && 
              <Button
                handleClick={()=>{setShowHiddenPaths(prev=>!prev); handlePageClick({selected: 0})}}
                isSecondary
                smallFont
                dataTooltipId={`${resultID}-excluded-paths-toggle`}
                className={`${!!isEven && styles.evenButton}`}
                >
                {showHiddenPaths ? `Hide ${filteredPathCount} Excluded Paths` : `Show ${filteredPathCount} Excluded Paths`}
                <Information/>
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
