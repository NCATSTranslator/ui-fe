import styles from './PathView.module.scss';
import { useState, useMemo, useCallback, useRef, createContext, FC } from "react";
import PathObject from '../PathObject/PathObject';
import Tooltip from '../Tooltip/Tooltip';
import ReactPaginate from 'react-paginate';
import ChevLeft from '../../Icons/Directional/Chevron/Chevron Left.svg?react';
import ChevRight from '../../Icons/Directional/Chevron/Chevron Right.svg?react';
import Information from '../../Icons/Status/Alerts/Info.svg?react';
import ResearchMultiple from '../../Icons/Queries/Evidence.svg?react';
import { cloneDeep, isEqual } from 'lodash';
import { numberToWords } from '../../Utilities/utilities';
import { hasSupport } from '../../Utilities/resultsFormattingFunctions';
import { FormattedEdgeObject, FormattedNodeObject, PathObjectContainer, SupportDataObject, PathFilterState} from '../../Types/results';
import { isFormattedEdgeObject } from '../../Utilities/utilities';
import { LastViewedPathIDContextType } from '../../Utilities/customHooks';

export const LastViewedPathIDContext = createContext<LastViewedPathIDContextType | undefined>(undefined);

const checkIndirectPathForSelections = (path: PathObjectContainer, selPath: PathObjectContainer) => {
  for(const [i, item] of path.path.subgraph.entries()) {
    if(i % 2 === 0)
      continue;
    let nextEdgeItem = item as FormattedEdgeObject;
    if(hasSupport(nextEdgeItem) && nextEdgeItem.support !== undefined) {
      for(const supportPath of nextEdgeItem.support) {
        if(isEqual(selPath, supportPath)) {
          supportPath.highlighted = true;
        }
      }
    }
  }
}

const getPathsWithSelectionsSet = (paths: PathObjectContainer[], selectedPaths: Set<PathObjectContainer> | null) => {
  if(selectedPaths!== null && selectedPaths.size > 0) {
    let newPaths = cloneDeep(paths);
    for(const path of newPaths) {
      for(const selPath of selectedPaths) {
        if(isEqual(selPath, path)) {
          path.highlighted = true;
        }
        if(path.path.inferred) {
          checkIndirectPathForSelections(path, selPath);
        }
      }
    }
    return newPaths.sort((a: PathObjectContainer, b: PathObjectContainer) => (b.highlighted === a.highlighted ? 0 : b.highlighted ? -1 : 1));
  } else {
    return paths;
  }
}

const sortArrayByIndirect = (array: any[]) => {
  return array.sort((a, b) => {
      let inferredA = a.path.inferred ? 1 : 0;
      let inferredB = b.path.inferred ? 1 : 0;
      return inferredA - inferredB;
  });
}

interface PathViewProps {
  active: boolean;
  isEven: boolean;
  isPathfinder: boolean;
  paths: PathObjectContainer[];
  selectedPaths: Set<PathObjectContainer> | null;
  handleEdgeSpecificEvidence:(edgeGroup: FormattedEdgeObject, path: PathObjectContainer) => void;
  handleActivateEvidence: (path: PathObjectContainer) => void;
  activeEntityFilters: string[];
  pathFilterState: PathFilterState;
}

const PathView: FC<PathViewProps> = ({ active, isEven, isPathfinder = false, paths, selectedPaths, handleEdgeSpecificEvidence, handleActivateEvidence, 
  activeEntityFilters, pathFilterState }) => {

  const itemsPerPage: number = 10;
  const formattedPaths = useMemo(() => getPathsWithSelectionsSet(paths, selectedPaths), [paths, selectedPaths]);
  const [itemOffset, setItemOffset] = useState<number>(0);
  const currentPage = useRef<number>(0);
  const endResultIndex = useRef<number>(itemsPerPage);
  const pageCount = (!!formattedPaths) ? Math.ceil(formattedPaths.length / itemsPerPage) : 0;
  
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

  const displayedPaths = sortArrayByIndirect(formattedPaths).slice(itemOffset, endResultIndex.current);
  // Create the context with a default value of null
  const [lastViewedPathID, setLastViewedPathID] = useState<string|null>(null);

  let directLabelDisplayed = false;
  let inferredLabelDisplayed = false;

  const handleNameClick = useCallback((name: FormattedNodeObject ) => {
    console.log("handle name click", name);
    if(Array.isArray(name.provenance) && name.provenance[0].length > 0 && name.provenance[0].includes("http"))
      window.open(name.provenance[0], '_blank');
  },[]);

  const handleEdgeClick = useCallback((edgeGroup: FormattedEdgeObject, path: PathObjectContainer) => {
    if(!!path?.id)
      setLastViewedPathID(path.id);
    handleEdgeSpecificEvidence(edgeGroup, path);
  }, [handleEdgeSpecificEvidence]);

  const handleTargetClick = useCallback((target: FormattedNodeObject) => {
    console.log("handle target click", target);
    if(Array.isArray(target.provenance) && target.provenance[0].length > 0 && target.provenance[0].includes("http"))
      window.open(target.provenance[0], '_blank');
  },[]);

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
              displayedPaths.map((pathToDisplay: PathObjectContainer, i: number)=> {
                const displayIndirectLabel = pathToDisplay.path.inferred && !inferredLabelDisplayed;
                  if(displayIndirectLabel)
                    inferredLabelDisplayed = true;
                const displayDirectLabel = !pathToDisplay.path.inferred && !directLabelDisplayed;
                  if(displayDirectLabel)
                    directLabelDisplayed = true;
                const tooltipID: string = (!!pathToDisplay?.id) ? pathToDisplay.id : i.toString();
                const isPathFiltered = (!!pathFilterState) ? pathFilterState[pathToDisplay.id] : false;
                const indexInFullCollection = (!!paths) ? paths.findIndex(item => item.id === pathToDisplay.id) : -1;
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
                        onClick={()=>handleActivateEvidence(pathToDisplay)}
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
                      <div className={`${styles.tableItem} path ${numberToWords(pathToDisplay.path.subgraph.length)} ${selectedPaths !== null && selectedPaths.size > 0 && !pathToDisplay.highlighted ? styles.unhighlighted : ''} ${isPathFiltered ? styles.filtered : ''}`} >
                        {
                          pathToDisplay.path.subgraph.map((pathItem: FormattedEdgeObject | FormattedNodeObject, j: number) => {
                            let key = `${pathItem.id ? pathItem.id : i}_${i}_${j}`;
                            let pathItemHasSupport = (isFormattedEdgeObject(pathItem)) ? pathItem.inferred : false;
                            let supportDataObject: SupportDataObject | null = (pathItemHasSupport)
                              ? {
                                  key: key,
                                  pathItem: pathItem,
                                  pathViewStyles: styles,
                                  selectedPaths: selectedPaths,
                                  pathToDisplay: pathToDisplay,
                                  handleActivateEvidence: handleActivateEvidence,
                                  handleNameClick: handleNameClick,
                                  handleEdgeClick: handleEdgeClick,
                                  handleTargetClick: handleTargetClick,
                                  activeEntityFilters: activeEntityFilters,
                                  tooltipID: null,
                                  supportPath: null
                                }
                              : null;
                            return (
                              <>
                                <PathObject
                                  pathViewStyles={styles}
                                  isEven={isEven}
                                  supportDataObject={supportDataObject}
                                  pathObjectContainer={pathToDisplay}
                                  pathObject={pathItem}
                                  id={key}
                                  key={key}
                                  handleNameClick={handleNameClick}
                                  handleEdgeClick={handleEdgeClick}
                                  handleTargetClick={handleTargetClick}
                                  activeEntityFilters={activeEntityFilters}
                                  hasSupport={pathItemHasSupport}
                                  pathFilterState={pathFilterState}
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
