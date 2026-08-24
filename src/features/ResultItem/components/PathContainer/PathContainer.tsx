import { FC, Fragment, memo, useCallback, useId, MouseEvent } from 'react';
import LastViewedTag from '@/features/ResultItem/components/LastViewedTag/LastViewedTag';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import ResearchMultiple from '@/assets/icons/queries/Evidence.svg?react';
import PathArrow from '@/assets/icons/connectors/PathArrow.svg?react';
import PathObject from '@/features/ResultItem/components/PathObject/PathObject';
import { Path, ResultEdge, ResultNode } from '@/features/ResultList/types/results';
import { PathFilterState } from '@/features/ResultList/types/results';
import { RefObject } from 'react';
import { extractEdgeIDsFromSubgraph, getIsPathFiltered } from '@/features/ResultItem/utils/utilities';
import { useLastViewedPath, useResultItemId, useSeenStatus } from '@/features/ResultItem/hooks/resultHooks';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import { EMPTY_STRING_ARRAY } from '@/features/Core/utils/constants';
import { numberToWords } from '@/features/Core/utils/stringFormatters';
import { useResultListContext } from '@/features/ResultList/context/ResultListContext';
import { useCanvasContextMenu } from '@/features/Canvas/components/CanvasContextMenu/CanvasContextMenu';
import { useResultEntityDraggable } from '@/features/DragAndDrop/hooks/useResultEntityDraggable';
import dragStyles from '@/features/DragAndDrop/styles/resultEntityDraggable.module.scss';
import PathGroupConnectors from '@/features/ResultItem/components/PathContainer/PathGroupConnectors';

interface PathContainerProps {
  path: Path;
  inModal: boolean;
  compressedSubgraph?: false | (ResultEdge | ResultNode | ResultEdge[])[];
  handleEdgeClick?: (edgeIDs: string[], path: Path) => void;
  activeEntityFilters: string[];
  pathFilterState: PathFilterState;
  pk: string;
  showHiddenPaths: boolean;
  selectedEdgeRef?: RefObject<HTMLElement | null>;
  selectedEdge?: ResultEdge | null;
  isEven: boolean;
  styles: { [key: string]: string;};
  /** Position of this path in the full collection, or -1 when not found. */
  pathIndex: number;
}

const PathContainer: FC<PathContainerProps> = ({
  path,
  inModal,
  compressedSubgraph,
  handleEdgeClick,
  activeEntityFilters,
  pathFilterState,
  pk,
  showHiddenPaths,
  selectedEdgeRef,
  selectedEdge,
  isEven,
  styles,
  pathIndex,
}) => {
  const { lastViewedPathID, setLastViewedPathID } = useLastViewedPath();
  const { navigateToEvidenceView } = useResultListContext();
  const { openMenu } = useCanvasContextMenu();
  const itemResultId = useResultItemId();

  const handlePathContextMenu = useCallback((e: MouseEvent) => {
    if (!path.id) return;
    e.preventDefault();
    e.stopPropagation();
    openMenu('path', path.id, pk, { x: e.clientX, y: e.clientY }, path);
  }, [path, pk, openMenu]);

  const isPathFiltered = getIsPathFiltered(path, pathFilterState);
  const edgeIds = extractEdgeIDsFromSubgraph(path.subgraph);
  const { isPathSeen } = useSeenStatus(pk);
  const isSeen = isPathSeen(edgeIds);
  const generatedId = useId();
  const tooltipID: string = path?.id ?? generatedId;
  const pathNumber = pathIndex !== -1 ? pathIndex + 1 : undefined;
  const parentPathKey = (pathIndex + 1).toString();
  const subgraphToMap = (!!path.compressedSubgraph && path.compressedSubgraph.length > 0) ? path.compressedSubgraph : path.subgraph;

  const pathDragData = path.id
    ? {
        type: 'path' as const,
        data: {
          id: path.id,
          pk,
          path,
          pathNumber,
          resultId: itemResultId,
        },
      }
    : null;
  const {
    attributes: pathDragAttributes,
    listeners: pathDragListeners,
    setNodeRef: setPathDragRef,
    isDragging: isPathDragging,
    canDrag: canDragPath,
  } = useResultEntityDraggable(pathDragData);
  
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
    numberToWords(path.subgraph.length)
  );

  return (
      <div className={formattedPathClass}>
        {
          ((!!lastViewedPathID && lastViewedPathID === path.id) || inModal) && 
          <LastViewedTag inModal={inModal} inGroup={!!(inModal && compressedSubgraph)} />
        }
        <button
          ref={setPathDragRef}
          onClick={() => {
            if (!!path?.id) {
              setLastViewedPathID(path.id);
              if (path.subgraph[1]) {
                navigateToEvidenceView({
                  edgeId: path.subgraph[1],
                  path,
                  pathKey: pathNumber?.toString() ?? "-",
                  resultId: itemResultId,
                });
              }
            }
          }}
          onContextMenu={path.id ? handlePathContextMenu : undefined}
          className={joinClasses(
            styles.pathEvidenceButton,
            canDragPath && dragStyles.draggable,
            isPathDragging && dragStyles.dragging,
          )}
          data-tooltip-id={tooltipID}
          {...pathDragListeners}
          {...pathDragAttributes}
        >
          <div className={styles.icon}>
            <ResearchMultiple />
          </div>
          <span className={styles.num}>
            <span className={styles.val}>{pathIndex + 1}</span>
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
                const hasSelected = !!selectedEdge && !!subgraphItem.find(edge => edge.id === selectedEdge.id);
                return (
                  <Fragment key={subgraphItem[0].id}>
                    <PathGroupConnectors
                      className={styles.connectors}
                      edges={subgraphItem}
                      nodeToEdge
                      selectedEdgeId={selectedEdge?.id}
                    />
                    <div className={`${styles.groupedPreds} ${hasSelected && styles.hasSelected}`}>
                      {subgraphItem.map((edge) => {
                        const key = `${edge.id}`;
                        const selected = !!selectedEdge && (selectedEdge.id === edge.id);
                        return (
                          <PathObject
                            activeEntityFilters={EMPTY_STRING_ARRAY}
                            handleEdgeClick={handleEdgeClick}
                            id={edge.id}
                            index={i}
                            inModal
                            isEven={false}
                            key={key}
                            parentPathKey={parentPathKey}
                            path={path}
                            pathViewStyles={styles}
                            pk={pk}
                            selected={selected}
                            selectedEdgeRef={selectedEdgeRef}
                          />
                        );
                      })}
                    </div>
                    <PathGroupConnectors
                      className={styles.connectors}
                      edges={subgraphItem}
                      nodeToEdge={false}
                      selectedEdgeId={selectedEdge?.id}
                    />
                  </Fragment>
                )
              } else {
                const key = (Array.isArray(subgraphItem)) ? subgraphItem[0].id : subgraphItem.id;
                const selected = !!selectedEdge && (selectedEdge.id === key);
                return (
                  <PathObject
                    activeEntityFilters={EMPTY_STRING_ARRAY}
                    handleEdgeClick={handleEdgeClick}
                    id={key}
                    index={i}
                    inModal
                    isEven={false}
                    key={key}
                    parentPathKey={parentPathKey}
                    path={path}
                    pk={pk}
                    pathViewStyles={styles}
                    selected={selected}
                    selectedEdgeRef={selectedEdgeRef}
                  />
                )
              }
            })
          ) : (
            subgraphToMap.map((subgraphItemID: string | string[], i: number) => {
              const selected = !!selectedEdge && (selectedEdge.id === subgraphItemID);
              const key = (Array.isArray(subgraphItemID)) ? subgraphItemID[0] : subgraphItemID;

              if (path.id === undefined)
                return null;
              return (
                <PathObject
                  pathViewStyles={styles}
                  index={i}
                  isEven={isEven}
                  inModal={inModal}
                  path={path}
                  parentPathKey={parentPathKey}
                  id={subgraphItemID}
                  key={key}
                  handleEdgeClick={handleEdgeClick}
                  activeEntityFilters={activeEntityFilters}
                  pk={pk}
                  selected={selected}
                  selectedEdgeRef={selectedEdgeRef}
                />
              )
            })
          )}
        </div>
      </div>
  );
};

export default memo(PathContainer);