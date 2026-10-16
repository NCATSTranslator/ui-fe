import { FC, MouseEvent, useCallback, useId } from 'react';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import ResearchMultiple from '@/assets/icons/queries/Evidence.svg?react';
import PathArrow from '@/assets/icons/connectors/PathArrow.svg?react';
import { Path } from '@/features/ResultList/types/results';
import { useLastViewedPath, useResultItemId } from '@/features/ResultItem/hooks/resultHooks';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import { useResultListContext } from '@/features/ResultList/context/ResultListContext';
import { useCanvasContextMenu } from '@/features/Canvas/components/CanvasContextMenu/CanvasContextMenu';
import { useResultEntityDraggable } from '@/features/DragAndDrop/hooks/useResultEntityDraggable';
import dragStyles from '@/features/DragAndDrop/styles/resultEntityDraggable.module.scss';
import { trackEvent } from '@/features/Analytics/utils/dataLayer';

interface PathEvidenceButtonProps {
  path: Path;
  pk: string;
  /** Position of this path in the full collection, or -1 when not found. */
  pathIndex: number;
  styles: { [key: string]: string };
}

/**
 * The numbered button at the head of a path that opens its evidence view.
 * Also serves as the path's drag handle and canvas context-menu target.
 */
const PathEvidenceButton: FC<PathEvidenceButtonProps> = ({ path, pk, pathIndex, styles }) => {
  const { setLastViewedPathID } = useLastViewedPath();
  const { navigateToEvidenceView } = useResultListContext();
  const { openMenu, canvasEnabled } = useCanvasContextMenu();
  const itemResultId = useResultItemId();
  const generatedId = useId();
  const tooltipID: string = path?.id ?? generatedId;
  const pathNumber = pathIndex !== -1 ? pathIndex + 1 : undefined;

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

  const handlePathContextMenu = useCallback((e: MouseEvent) => {
    if (!path.id) return;
    e.preventDefault();
    e.stopPropagation();
    openMenu({ type: 'path', id: path.id, pk, position: { x: e.clientX, y: e.clientY }, path });
  }, [path, pk, openMenu]);

  const handlePathClick = useCallback(() => {
    if (!path?.id) return;
    setLastViewedPathID(path.id);
    if (!path.subgraph[1]) return;
    trackEvent('evidence_opened', {
      evidence_source: 'path',
      path_rank: pathNumber ?? undefined,
      // subgraph alternates node/edge, so its length encodes hops.
      path_length: path.subgraph.length,
    });
    navigateToEvidenceView({
      edgeId: path.subgraph[1],
      path,
      pathKey: pathNumber?.toString() ?? "-",
      resultId: itemResultId,
    });
  }, [path, pathNumber, itemResultId, setLastViewedPathID, navigateToEvidenceView]);

  return (
    <>
      <button
        ref={setPathDragRef}
        onClick={handlePathClick}
        onContextMenu={path.id && canvasEnabled ? handlePathContextMenu : undefined}
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
    </>
  );
};

export default PathEvidenceButton;
