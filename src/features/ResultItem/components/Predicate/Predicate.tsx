import { FC, MouseEvent, useCallback, useMemo, RefObject } from 'react';
import styles from './Predicate.module.scss';
import PathArrow from '@/assets/icons/connectors/PathArrow.svg?react';
import PubIcon from '@/assets/icons/status/HasPub.svg?react';
import CTIcon from '@/assets/icons/status/HasCT.svg?react';
import AcceptedOntologyIcon from '@/assets/icons/queries/Accepted Ontology.svg?react';
import Highlighter from 'react-highlight-words';
import { getCompressedEdge } from '@/features/Core/utils/resultHelpers';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import { checkEdgesForClinicalTrials, checkEdgesForPubs } from '@/features/Evidence/utils/utilities';
import Tooltip from '@/features/Core/components/Tooltip/Tooltip';
import EdgeTooltipContent from '@/features/Core/components/Tooltips/EdgeTooltipContent';
import { edgesToTooltipEntries } from '@/features/Core/components/Tooltips/tooltipMappers';
import { Path, ResultEdge } from '@/features/ResultList/types/results';
import { getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { useSelector } from 'react-redux';
import { useLastViewedPath, useResultItemId } from '@/features/ResultItem/hooks/resultHooks';
import { isAcceptedOntologyEdge } from '@/features/ResultItem/utils/utilities';
import { useResultListContext } from '@/features/ResultList/context/ResultListContext';
import { extractCompressedEdgeSets } from '@/features/Navigation/utils/navigationUtils';
import { PredicateClickOptions } from '@/features/Core/components/Tooltips/EdgeTooltipContent';
import { useCanvasContextMenu } from '@/features/Canvas/components/CanvasContextMenu/CanvasContextMenu';
import { useResultEntityDraggable } from '@/features/DragAndDrop/hooks/useResultEntityDraggable';
import dragStyles from '@/features/DragAndDrop/styles/resultEntityDraggable.module.scss';

interface PredicateProps {
  activeEntityFilters: string[];
  className?: string;
  handleEdgeClick?: (edgeIDs: string[], path: Path) => void;
  hoverHandlers?: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
  edge: ResultEdge;
  edgeIds: string[];
  inModal?: boolean | null;
  isEven?: boolean;
  isHighlighted?: boolean;
  isSeen?: boolean;
  parentClass?: string;
  parentStyles?: {[key: string]: string;} | null;
  path: Path;
  parentPathKey: string;
  pathViewStyles?: {[key: string]: string;} | null;
  pk: string;
  selected?: boolean;
  selectedEdgeRef?: RefObject<HTMLElement | null>;
  uid: string;
}

const Predicate: FC<PredicateProps> = ({
  activeEntityFilters,
  className = "",
  edge,
  edgeIds,
  handleEdgeClick,
  hoverHandlers,
  inModal = false,
  isEven = false,
  isHighlighted = false,
  isSeen = false,
  parentClass = '',
  parentStyles,
  path,
  parentPathKey,
  pathViewStyles = null,
  pk,
  selected = false,
  selectedEdgeRef,
  uid }) => {

  const resultSet = useSelector(getResultSetById(pk));
  const { openMenu } = useCanvasContextMenu();
  const formattedEdge = (!!resultSet && Array.isArray(edgeIds) && edgeIds.length > 1) ? getCompressedEdge(resultSet, edgeIds) : edge;
  const hasMore = (!!formattedEdge?.compressed_edges && formattedEdge.compressed_edges.length > 0);

  const {
    attributes: edgeDragAttributes,
    listeners: edgeDragListeners,
    setNodeRef: setEdgeDragRef,
    isDragging: isEdgeDragging,
    canDrag: canDragEdge,
  } = useResultEntityDraggable({
    type: 'edge',
    data: { id: edgeIds[0], pk },
  });

  const setEdgeRef = useCallback((node: HTMLSpanElement | null) => {
    setEdgeDragRef(node);
    if (selected && selectedEdgeRef) {
      selectedEdgeRef.current = node;
    }
  }, [setEdgeDragRef, selected, selectedEdgeRef]);

  const { navigateToEvidenceView } = useResultListContext();
  const itemResultId = useResultItemId();
  const { setLastViewedPathID } = useLastViewedPath();

  const edgeArrayToCheck = (!!formattedEdge?.compressed_edges && formattedEdge.compressed_edges.length > 0) ? [...formattedEdge.compressed_edges, formattedEdge] : [formattedEdge];
  const hasPubs = checkEdgesForPubs(edgeArrayToCheck);
  const hasCTs = checkEdgesForClinicalTrials(edgeArrayToCheck);
  const isAcceptedOntology = isAcceptedOntologyEdge(formattedEdge);

  const edgesToDisplay: ResultEdge[] = (!!formattedEdge?.compressed_edges)
  ? [...formattedEdge.compressed_edges, formattedEdge]
  : [formattedEdge];

  const tooltipEdgeEntries = useMemo(() => {
    if (!resultSet) return [];
    return edgesToTooltipEntries(resultSet, edgesToDisplay.filter(Boolean) as ResultEdge[]);
  }, [resultSet, formattedEdge]);

  const edgeClass = joinClasses(
    styles.edge,
    className,
    parentClass,
    hasPubs && styles.hasPubs,
    hasCTs && styles.hasCTs,
    !!pathViewStyles && pathViewStyles.predicateInterior,
    (isSeen && parentStyles) && `${parentStyles.seen}`,
    (selected && parentStyles) && `${parentStyles.selected} ${styles.selected}`,
    (inModal && parentStyles) && `${parentStyles.inModal} ${styles.inModal}`,
    (isEven && parentStyles) && `${parentStyles.isEven} ${styles.isEven}`,
    (isHighlighted && parentStyles) && `${parentStyles.highlighted} ${styles.highlighted}`,
    canDragEdge && dragStyles.draggable,
    isEdgeDragging && dragStyles.dragging,
  )

  const handlePredicateClick = (e: MouseEvent<HTMLSpanElement>, selectedEdgeId: string, compressedEdgeIds: string[], targetPath: Path, targetFullPathKey: string, options?: PredicateClickOptions) => {
    e.stopPropagation();
    handleEdgeClick?.([selectedEdgeId, ...compressedEdgeIds], targetPath);
    setLastViewedPathID(targetPath?.id || null);
    if(!inModal) {
      let allSets = extractCompressedEdgeSets(targetPath);
      if (allSets.length === 0 && edgeIds.length > 1) allSets = [edgeIds];
      navigateToEvidenceView({
        edgeId: selectedEdgeId,
        path: targetPath,
        pathKey: targetFullPathKey,
        compressedEdgeSets: allSets,
        tab: options?.tab,
        resultId: itemResultId,
      });
    }
  }

  return (
    <span
      ref={setEdgeRef}
      className={edgeClass}
      data-tooltip-id={`${formattedEdge.predicate}${uid}`}
      data-edge-ids={edgeIds.toString()}
      data-aras={edge.aras.toString()}
      onClick={(e)=> handlePredicateClick(e, edgeIds[0], edgeIds.slice(1), path, parentPathKey)}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); openMenu('edge', edgeIds[0], pk, { x: e.clientX, y: e.clientY }); }}
      {...hoverHandlers}
      {...edgeDragListeners}
      {...edgeDragAttributes}
      >
      <div className={`${parentStyles && parentStyles.nameShape} ${styles.nameShape}`}>
        <div className={`${parentStyles && parentStyles.background} ${styles.background}`}></div>
      </div>
      <PathArrow className={`${parentStyles && parentStyles.icon} ${pathViewStyles && pathViewStyles.icon}`}/>
      <Tooltip
        id={`${formattedEdge.predicate}${uid}`}
        place={`${inModal ? 'left' : 'top' }`}
        >
        {resultSet &&
          <EdgeTooltipContent
            edges={tooltipEdgeEntries}
            activeEntityFilters={activeEntityFilters}
            isAcceptedOntology={isAcceptedOntology}
            inModal={!!inModal}
            onPredicateClick={(e, edgeId, options) => handlePredicateClick(e, edgeId, edgeIds.filter(id => id !== edgeId), path, parentPathKey, options)}
          />
        }
      </Tooltip>
      <span
        className={`${styles.pred} pred ${hasMore ? styles.hasMore : ''}`}
        >
        <span className={styles.predLabel}>
          <Highlighter
            highlightClassName="highlight"
            searchWords={activeEntityFilters}
            autoEscape={true}
            textToHighlight={formattedEdge.predicate}
          />
          {
            !!formattedEdge?.compressed_edges && formattedEdge.compressed_edges.length > 0 &&
            <span className={styles.more}>+{formattedEdge.compressed_edges.length}</span>
          }
        </span>
        {
          (hasPubs || hasCTs || isAcceptedOntology) &&
          <div className={styles.badges}>
            {
              hasCTs && <CTIcon/>
            }
            {
              hasPubs && <PubIcon/>
            }
            {
              isAcceptedOntology && <AcceptedOntologyIcon/>
            }
          </div>
        }
      </span>
    </span>
  )
}

export default Predicate;
