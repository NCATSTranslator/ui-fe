import { FC, ReactNode, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  getNodeById,
  getNodeSpecies,
  getResultById,
  getResultSetById,
} from '@/features/ResultList/slices/resultsSlice';
import { nodeToTooltipProps } from '@/features/Core/components/Tooltips/tooltipMappers';
import { formatBiolinkEntity, formatBiolinkNode } from '@/features/Core/utils/stringFormatters';
import { getCompressedEdge, isStringArray } from '@/features/Core/utils/resultHelpers';
import { getNodeIcon } from '@/features/Core/utils/entityLinks';
import type { ResultEntityDraggableData } from '@/features/DragAndDrop/types/types';
import type { Path, Result, ResultNode, ResultSet } from '@/features/ResultList/types/results';
import styles from './ResultEntityDragOverlay.module.scss';

export type ResultEntityDragOverlayData = ResultEntityDraggableData;

interface ResultEntityDragOverlayProps {
  dragData: ResultEntityDragOverlayData;
}

type OverlayContent = {
  kind: ResultEntityDragOverlayData['type'];
  label: string;
  icon: ReactNode;
};

const formatNodeLabel = (node: ResultNode | null | undefined, fallback: string): string => {
  if (!node) return fallback;
  return nodeToTooltipProps(node).nameString;
};

const formatNamedResultLabel = (
  drugName: string,
  subjectNode: ResultNode | null | undefined,
): string => {
  const typeString = subjectNode?.types[0] ? formatBiolinkEntity(subjectNode.types[0]) : '';
  return formatBiolinkNode(drugName, typeString, subjectNode ? getNodeSpecies(subjectNode) : null);
};

const resultContainsPath = (result: Result, pathId: string): boolean => {
  if (isStringArray(result.paths)) return result.paths.includes(pathId);
  return result.paths.some(path => path.id === pathId);
};

const formatResultName = (
  resultSet: ResultSet,
  resultId: string | undefined,
  path: Path | undefined,
): string | null => {
  const result = (resultId && getResultById(resultSet, resultId))
    || (path?.id ? resultSet.data.results.find(item => resultContainsPath(item, path.id as string)) : undefined);
  if (!result?.drug_name) return null;
  return formatNamedResultLabel(result.drug_name, getNodeById(resultSet, result.subject));
};

const overlayForNode = (
  resultSet: ResultSet,
  id: string,
): OverlayContent => {
  const node = getNodeById(resultSet, id);
  return {
    kind: 'node',
    label: formatNodeLabel(node, id),
    icon: getNodeIcon(node?.types[0] ?? ''),
  };
};

const overlayForEdge = (
  resultSet: ResultSet,
  id: string,
  edgeIds: string[],
): OverlayContent => {
  const edge = resultSet.data.edges[id];
  if (!edge) {
    return { kind: 'edge', label: id, icon: null };
  }
  const subjectLabel = formatNodeLabel(getNodeById(resultSet, edge.subject), edge.subject);
  const objectLabel = formatNodeLabel(getNodeById(resultSet, edge.object), edge.object);
  const formattedEdge = edgeIds.length > 1 ? getCompressedEdge(resultSet, edgeIds) : edge;
  const extraCount = formattedEdge.compressed_edges?.length ?? 0;
  const suffix = extraCount > 0 ? ` +${extraCount}` : '';
  return {
    kind: 'edge',
    label: `${subjectLabel} ${formattedEdge.predicate} ${objectLabel}${suffix}`,
    icon: null,
  };
};

const overlayForResult = (
  resultSet: ResultSet,
  id: string,
): OverlayContent => {
  const result = getResultById(resultSet, id);
  const resultNode = result ? getNodeById(resultSet, result.subject) : undefined;
  const label = result?.drug_name
    ? formatNamedResultLabel(result.drug_name, resultNode)
    : id;
  return {
    kind: 'result',
    label,
    icon: getNodeIcon(resultNode?.types[0] ?? ''),
  };
};

const overlayForPath = (
  resultSet: ResultSet,
  data: Extract<ResultEntityDragOverlayData, { type: 'path' }>['data'],
): OverlayContent => {
  const resultName = formatResultName(resultSet, data.resultId, data.path);
  const pathLabel = typeof data.pathNumber === 'number' ? `Path ${data.pathNumber}` : 'Path';
  return {
    kind: 'path',
    label: resultName ? `${resultName} ${pathLabel}` : pathLabel,
    icon: null,
  };
};

const getOverlayContent = (
  dragData: ResultEntityDragOverlayData,
  resultSet: ResultSet | null | undefined,
): OverlayContent => {
  if (!resultSet) {
    return { kind: dragData.type, label: dragData.data.id, icon: null };
  }
  if (dragData.type === 'node') return overlayForNode(resultSet, dragData.data.id);
  if (dragData.type === 'edge') return overlayForEdge(resultSet, dragData.data.id, dragData.data.edgeIds);
  if (dragData.type === 'result') return overlayForResult(resultSet, dragData.data.id);
  return overlayForPath(resultSet, dragData.data);
};

const ResultEntityDragOverlay: FC<ResultEntityDragOverlayProps> = ({ dragData }) => {
  const resultSet = useSelector(getResultSetById(dragData.data.pk));
  const content = useMemo(
    () => getOverlayContent(dragData, resultSet),
    [dragData, resultSet],
  );

  return (
    <div className={styles.overlay} data-kind={content.kind}>
      {content.icon && <span className={styles.icon}>{content.icon}</span>}
      <span className={styles.label}>{content.label}</span>
    </div>
  );
};

export default ResultEntityDragOverlay;
