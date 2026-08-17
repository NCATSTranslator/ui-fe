import { FC, ReactNode, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  getNodeById,
  getNodeSpecies,
  getResultById,
  getResultSetById,
} from '@/features/ResultList/slices/resultsSlice';
import { nodeToTooltipProps } from '@/features/Core/components/Tooltips/tooltipMappers';
import { formatBiolinkNode } from '@/features/Core/utils/stringFormatters';
import { getNodeIcon } from '@/features/Core/utils/entityLinks';
import ResearchMultiple from '@/assets/icons/queries/Evidence.svg?react';
import type { DraggableData } from '@/features/DragAndDrop/types/types';
import type { ResultNode, ResultSet } from '@/features/ResultList/types/results';
import styles from './ResultEntityDragOverlay.module.scss';

export type ResultEntityDragOverlayData = Extract<
  DraggableData,
  { type: 'node' | 'edge' | 'path' }
>;

interface ResultEntityDragOverlayProps {
  dragData: ResultEntityDragOverlayData;
}

const formatNodeLabel = (node: ResultNode | null | undefined, fallback: string): string => {
  if (!node) return fallback;
  return nodeToTooltipProps(node).nameString;
};

const formatResultName = (resultSet: ResultSet, resultId: string | undefined): string | null => {
  if (!resultId) return null;
  const result = getResultById(resultSet, resultId);
  if (!result?.drug_name) return null;
  const subjectNode = getNodeById(resultSet, result.subject);
  const type = subjectNode?.types?.[0]?.replace('biolink:', '') ?? '';
  return formatBiolinkNode(result.drug_name, type, subjectNode ? getNodeSpecies(subjectNode) : null);
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

    const resultName = formatResultName(resultSet, dragData.data.resultId);
    const pathNumber = dragData.data.pathNumber;
    const pathLabel = pathNumber != null
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
