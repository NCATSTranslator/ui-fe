import { createContext, FC, useState } from 'react';
import LastViewedTag from '@/features/ResultItem/components/LastViewedTag/LastViewedTag';
import Tooltip from '@/features/Common/components/Tooltip/Tooltip';
import ResearchMultiple from '@/assets/icons/queries/Evidence.svg?react';
import PathArrow from '@/assets/icons/connectors/PathArrow.svg?react';
import PathObject from '@/features/ResultItem/components/PathObject/PathObject';
import { Path, ResultEdge } from '@/features/ResultList/types/results';
import { Filter } from '@/features/ResultFiltering/types/filters';
import { PathFilterState } from '@/features/ResultList/types/results';
import { RefObject } from 'react';

export const ExpandedPredicateContext = createContext<{
  expandedPredicateId: string | null;
  setExpandedPredicateId: (id: string | null) => void;
} | null>(null);

interface PathContainerProps {
  formattedPathClass: string;
  lastViewedPathID: string | null;
  setLastViewedPathID: (id: string | null) => void;
  path: Path;
  inModal: boolean;
  compressedSubgraph?: false | (ResultEdge | any | ResultEdge[])[];
  indexInFullCollection: number;
  handleActivateEvidence: (path: Path, pathKey: string) => void;
  handleEdgeClick: (edgeIDs: string[], path: Path, pathKey: string) => void;
  handleNodeClick: (name: any) => void;
  activeEntityFilters: string[];
  selectedPaths: Set<Path> | null;
  pathFilterState: PathFilterState;
  activeFilters: Filter[];
  pk: string;
  showHiddenPaths: boolean;
  selected: boolean;
  selectedEdgeRef?: RefObject<HTMLElement | null>;
  selectedEdge?: ResultEdge | null;
  isEven: boolean;
  hoveredIndex: number | null;
  styles: any;
  displayDirectLabel: boolean;
  displayIndirectLabel: boolean;
  tooltipID: string;
  subgraphToMap: (string | string[])[];
  pathClass: string;
  edgeHeight: number;
  svgWidth: number;
  curveOffset: number;
  straightSegmentLength: number;
  pathThickness: number;
  getStrokeColor: (index: number, hoveredIndex: number | null, selected: boolean) => string;
  generatePathD: (index: number, svgHeight: number, svgWidth: number, edgeHeight: number, enter: boolean, curveOffset?: number, straightSegment?: number) => string;
}

const PathContainer: FC<PathContainerProps> = ({
  formattedPathClass,
  lastViewedPathID,
  setLastViewedPathID,
  path,
  inModal,
  compressedSubgraph,
  indexInFullCollection,
  handleActivateEvidence,
  handleEdgeClick,
  handleNodeClick,
  activeEntityFilters,
  selectedPaths,
  pathFilterState,
  activeFilters,
  pk,
  showHiddenPaths,
  selected,
  selectedEdgeRef,
  selectedEdge,
  isEven,
  hoveredIndex,
  styles,
  displayDirectLabel,
  displayIndirectLabel,
  tooltipID,
  subgraphToMap,
  pathClass,
  edgeHeight,
  svgWidth,
  curveOffset,
  straightSegmentLength,
  pathThickness,
  getStrokeColor,
  generatePathD,
}) => {
  const [expandedPredicateId, setExpandedPredicateId] = useState<string | null>(null);

  return (
    <ExpandedPredicateContext.Provider value={{ expandedPredicateId, setExpandedPredicateId }}>
      <div className={formattedPathClass}>
        
        {((!!lastViewedPathID && lastViewedPathID === path.id) || inModal) && (
          <LastViewedTag inModal={inModal} inGroup={!!(inModal && compressedSubgraph)} />
        )}
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
            subgraphToMap.map((subgraphItemID, i) => {
              let selected = (!!selectedEdge && selectedEdge.id === subgraphItemID) ? true : false;
              let key = (Array.isArray(subgraphItemID)) ? subgraphItemID[0] : subgraphItemID;
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