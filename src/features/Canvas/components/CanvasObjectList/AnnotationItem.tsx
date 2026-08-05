import { FC, MouseEvent } from 'react';
import styles from './CanvasObjectList.module.scss';
import type { CanvasAnnotation } from '@/features/Canvas/types/canvas';
import { getAnnotationDisplayName } from '@/features/Canvas/utils/canvasFunctions';
import ObjectListItem from './ObjectListItem';
import {
  OBJECT_LIST_ANNOTATION_ACTIONS,
  type CanvasAnnotationAction,
} from '@/features/Canvas/constants/canvasAnnotationActions';

export interface AnnotationItemProps {
  annotation: CanvasAnnotation;
  menuId: string | null;
  onAnnotationClick: (annotation: CanvasAnnotation) => void;
  onHoverAnnotation: (annotationId: string | null) => void;
  onMenuToggle: (annotationId: string, e: MouseEvent) => void;
  onMenuAction: (action: CanvasAnnotationAction, annotation: CanvasAnnotation) => void;
}

const AnnotationItem: FC<AnnotationItemProps> = ({
  annotation,
  menuId,
  onAnnotationClick,
  onHoverAnnotation,
  onMenuToggle,
  onMenuAction,
}) => {
  const displayName = getAnnotationDisplayName(annotation);

  return (
    <ObjectListItem<CanvasAnnotationAction>
      itemId={annotation.id}
      displayName={displayName}
      isEmptyName={!annotation.text.trim()}
      meta={<span className={styles.typeChip}>Annotation</span>}
      menuId={menuId}
      ariaLabel={`Actions for ${displayName}`}
      actions={OBJECT_LIST_ANNOTATION_ACTIONS}
      onItemClick={() => onAnnotationClick(annotation)}
      onHover={onHoverAnnotation}
      onMenuToggle={onMenuToggle}
      onMenuAction={action => onMenuAction(action, annotation)}
    />
  );
};

export default AnnotationItem;
