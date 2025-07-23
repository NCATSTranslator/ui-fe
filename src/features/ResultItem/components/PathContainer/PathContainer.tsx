import { createContext, FC, useId, useRef, useState } from 'react';
import LastViewedTag from '@/features/ResultItem/components/LastViewedTag/LastViewedTag';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import ResearchMultiple from '@/assets/icons/queries/Evidence.svg?react';
import PathArrow from '@/assets/icons/connectors/PathArrow.svg?react';
import PathObject from '@/features/ResultItem/components/PathObject/PathObject';
import { isResultEdge, Path, ResultEdge } from '@/features/ResultList/types/results';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { PathFilterState } from '@/features/ResultList/types/results';
import { RefObject } from 'react';
import { extractEdgeIDsFromSubgraph, generatePathD, generatePredicateId, getIsPathFiltered } from '@/features/ResultItem/utils/utilities';
import { useSeenStatus } from '@/features/ResultItem/hooks/resultHooks';
import { getCompressedEdge, hasSupport, joinClasses } from '@/features/Common/utils/utilities';
import { numberToWords } from '@/features/Common/utils/utilities';
import { getEdgeById, getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { useSelector } from 'react-redux';

export const ExpandedPredicateContext = createContext<{
  expandedPredicateId: string | null;
  setExpandedPredicateId: (id: string | null) => void;
} | null>(null);

interface PathContainerProps {
  lastViewedPathID: string | null;
  setLastViewedPathID: (id: string | null) => void;
  path: Path;
  inModal: boolean;
  compressedSubgraph?: false | (ResultEdge | any | ResultEdge[])[];
  handleActivateEvidence: (path: Path, pathKey: string) => void;
  handleEdgeClick: (edgeIDs: string[], path: Path, pathKey: string) => void;
  handleNodeClick: (name: any) => void;
  activeEntityFilters: string[];
  selectedPaths: Set<Path> | null;
  pathFilterState: PathFilterState;
  activeFilters: Filter[];
  pk: string;
  showHiddenPaths: boolean;
  selectedEdgeRef?: RefObject<HTMLElement | null>;
  selectedEdge?: ResultEdge | null;
  isEven: boolean;
  hoveredIndex: number | null;
  styles: any;
  formattedPaths: Path[];
}

const PathContainer: FC<PathContainerProps> = ({
  lastViewedPathID,
  setLastViewedPathID,
  path,
  inModal,
  compressedSubgraph,
  handleActivateEvidence,
  handleEdgeClick,
  handleNodeClick,
  activeEntityFilters,
  selectedPaths,
  pathFilterState,
  activeFilters,
  pk,
  showHiddenPaths,
  selectedEdgeRef,
  selectedEdge,
  isEven,
  hoveredIndex,
  styles,
  formattedPaths,
}) => {
  const resultSet = useSelector(getResultSetById(pk));
  const [expandedPredicateId, setExpandedPredicateId] = useState<string | null>(null);
  const initialExpandedPredicateIdSet = useRef(false);

  const isPathFiltered = getIsPathFiltered(path, pathFilterState);
  const edgeIds = extractEdgeIDsFromSubgraph(path.subgraph);
  const { isPathSeen } = useSeenStatus(pk);
  const isSeen = isPathSeen(edgeIds);
  const tooltipID: string = (!!path?.id) ? path.id : useId();
  const indexInFullCollection = (!!formattedPaths) ? formattedPaths.findIndex(item => item.id === path.id) : -1;
  const subgraphToMap = (!!path.compressedSubgraph && path.compressedSubgraph.length > 0) ? path.compressedSubgraph : path.subgraph;
  
  // Return null if path is filtered and hidden paths are not shown
  if (isPathFiltered && !showHiddenPaths)
    return null;
  
  const formattedPathClass = joinClasses(
    styles.formattedPath,
    (!!lastViewedPathID && lastViewedPathID === path.id) && styles.lastViewed,
    isEven && styles.isEven,
    isPathFiltered && styles.filtered,
    isSeen && styles.seenPath
  );
  const pathClass = joinClasses(
    (inModal && compressedSubgraph) && styles.compressedTableItem,
    styles.tableItem,
    'path',
    numberToWords(path.subgraph.length),
    (selectedPaths !== null && selectedPaths.size > 0 && !path.highlighted) && styles.unhighlighted
  );

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

  return (
    <ExpandedPredicateContext.Provider value={{ expandedPredicateId, setExpandedPredicateId }}>
      <div className={formattedPathClass}>
        {
          ((!!lastViewedPathID && lastViewedPathID === path.id) || inModal) && 
          <LastViewedTag inModal={inModal} inGroup={!!(inModal && compressedSubgraph)} />
        }
        <button
          onClick={() => {
            if (!!path?.id) {
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
            <span className={styles.val}>{indexInFullCollection + 1}</span>
            <PathArrow />
          </span>
        </button>
        <Tooltip id={tooltipID}>
          <span>View evidence for this path.</span>
        </Tooltip>
        <div data-path-id={`${path.id || ""}`} className={pathClass}>
          {inModal && compressedSubgraph ? (
            compressedSubgraph.map((subgraphItem, i) => {
              if (Array.isArray(subgraphItem) && subgraphItem.length > 1) {
                const svgHeight = (subgraphItem.length * (edgeHeight + 8)) - 8;
                let hasSelected = (!!selectedEdge && subgraphItem.find(edge => edge.id === selectedEdge.id)) ? true : false;
                return (
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
                      {subgraphItem.map((edge) => {
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
                            handleNodeClick={() => { console.log("evidence modal node clicked!") }}
                            handleEdgeClick={handleEdgeClick}
                            pathFilterState={{}}
                            activeFilters={[]}
                            activeEntityFilters={[]}
                            selected={selected}
                            selectedPaths={null}
                            inModal={true}
                            pk={pk}
                            selectedEdgeRef={selectedEdgeRef}
                          />
                        )
                      })}
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
                    handleNodeClick={() => { console.log("evidence modal node clicked!") }}
                    handleEdgeClick={handleEdgeClick}
                    pathFilterState={{}}
                    activeFilters={[]}
                    activeEntityFilters={[]}
                    selected={selected}
                    selectedPaths={null}
                    inModal={true}
                    pk={pk}
                    selectedEdgeRef={selectedEdgeRef}
                  />
                )
              }
            })
          ) : (
            subgraphToMap.map((subgraphItemID: string | string[], i: number) => {
              let selected = (!!selectedEdge && selectedEdge.id === subgraphItemID) ? true : false;
              let key = (Array.isArray(subgraphItemID)) ? subgraphItemID[0] : subgraphItemID;
              // check for inferred edges and set the expanded predicate id if it's the first one in the path
              if(i % 2 !== 0) {
                const formattedEdge = (i % 2 !== 0) && (!!resultSet && Array.isArray(subgraphItemID) && subgraphItemID.length > 1) ? getCompressedEdge(resultSet, subgraphItemID) : getEdgeById(resultSet, subgraphItemID as string);
                const isInferred = hasSupport(formattedEdge);
                if(isInferred && !initialExpandedPredicateIdSet.current) {
                  const edgeIds = (Array.isArray(subgraphItemID)) ? subgraphItemID : [subgraphItemID];
                  setExpandedPredicateId(generatePredicateId(path, edgeIds));  
                  initialExpandedPredicateIdSet.current = true;
                }
              }

              if (path.id === undefined)
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
                    selectedEdgeRef={selectedEdgeRef}
                  />
                </>
              )
            })
          )}
        </div>
      </div>
    </ExpandedPredicateContext.Provider>
  );
};

export default PathContainer; 