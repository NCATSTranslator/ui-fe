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
import { isStringArray } from '@/features/Core/utils/resultHelpers';
import { getNodeIcon } from '@/features/Core/utils/entityLinks';
import type { ResultEntityDraggableData } from '@/features/DragAndDrop/types/types';
import type { Path, Result, ResultNode, ResultSet } from '@/features/ResultList/types/results';
import styles from './ResultEntityDragOverlay.module.scss';

export type ResultEntityDragOverlayData = ResultEntityDraggableData;

interface ResultEntityDragOverlayProps {
  dragData: ResultEntityDragOverlayData;
}

const formatNodeLabel = (node: ResultNode | null | undefined, fallback: string): string => {
  if (!node) return fallback;
  return nodeToTooltipProps(node).nameString;
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
  const subjectNode = getNodeById(resultSet, result.subject);
  const typeString = subjectNode?.types[0] ? formatBiolinkEntity(subjectNode.types[0]) : '';
  return formatBiolinkNode(result.drug_name, typeString, subjectNode ? getNodeSpecies(subjectNode) : null);
};

const ResultEntityDragOverlay: FC<ResultEntityDragOverlayProps> = ({ dragData }) => {
  const resultSet = useSelector(getResultSetById(dragData.data.pk));

  const content = useMemo(() => {
    if (!resultSet) {
      return { kind: dragData.type, label: dragData.data.id, icon: null as ReactNode };
    }

    if (dragData.type === 'node') {
      const node = getNodeById(resultSet, dragData.data.id);
      return {
        kind: 'node' as const,
        label: formatNodeLabel(node, dragData.data.id),
        icon: getNodeIcon(node?.types[0] ?? ''),
      };
    }

    if (dragData.type === 'edge') {
      const edge = resultSet.data.edges[dragData.data.id];
      if (!edge) {
        return { kind: 'edge' as const, label: dragData.data.id, icon: null as ReactNode };
      }
      const subject = getNodeById(resultSet, edge.subject);
      const object = getNodeById(resultSet, edge.object);
      const subjectLabel = formatNodeLabel(subject, edge.subject);
      const objectLabel = formatNodeLabel(object, edge.object);
      return {
        kind: 'edge' as const,
        label: `${subjectLabel} ${edge.predicate} ${objectLabel}`,
        icon: null as ReactNode,
      };
    }

    if (dragData.type === 'result') {
      const result = getResultById(resultSet, dragData.data.id);
      const resultNode = result ? getNodeById(resultSet, result.subject) : undefined;
      const label = result?.drug_name
        ? formatBiolinkNode(
          result.drug_name,
          resultNode?.types[0] ? formatBiolinkEntity(resultNode.types[0]) : '',
          resultNode ? getNodeSpecies(resultNode) : null,
        )
        : dragData.data.id;
      return {
        kind: 'result' as const,
        label,
        icon: getNodeIcon(resultNode?.types[0] ?? ''),
      };
    }

    const resultName = formatResultName(resultSet, dragData.data.resultId, dragData.data.path);
    const pathNumber = dragData.data.pathNumber;
    const pathLabel = typeof pathNumber === 'number'
      ? `Path ${pathNumber}`
      : 'Path';
    const label = resultName ? `${resultName} ${pathLabel}` : pathLabel;

    return {
      kind: 'path' as const,
      label,
      icon: null as ReactNode
    };
  }, [dragData, resultSet]);

  return (
    <div className={styles.overlay} data-kind={content.kind}>
      {content.icon && <span className={styles.icon}>{content.icon}</span>}
      <span className={styles.label}>{content.label}</span>
    </div>
  );
};

export default ResultEntityDragOverlay;
