import { memo, useCallback, useMemo, type FC, type MouseEvent } from 'react';
import styles from './CanvasObjectList.module.scss';
import type { CanvasAnnotation } from '@/features/Canvas/types/canvas';
import { getAnnotationDisplayName, getCanvasAnnotationSearchMatchesOutsideDisplayName } from '@/features/Canvas/utils/canvasFunctions';
import ObjectListItem from './ObjectListItem';
import {
  OBJECT_LIST_ANNOTATION_ACTIONS,
  type CanvasAnnotationAction,
} from '@/features/Canvas/constants/canvasAnnotationActions';

export interface AnnotationItemProps {
  annotation: CanvasAnnotation;
  searchTerm?: string;
  menuId: string | null;
  onAnnotationClick: (annotationId: string) => void;
  onHoverAnnotation: (annotationId: string | null) => void;
  onMenuToggle: (annotationId: string, e: MouseEvent) => void;
  onMenuAction: (action: CanvasAnnotationAction, annotation: CanvasAnnotation) => void;
}

const ANNOTATION_META = <span className={styles.typeChip}>Annotation</span>;

const AnnotationItem: FC<AnnotationItemProps> = ({
  annotation,
  searchTerm,
  menuId,
  onAnnotationClick,
  onHoverAnnotation,
  onMenuToggle,
  onMenuAction,
}) => {
  const displayName = getAnnotationDisplayName(annotation);
  const externalSearchMatches = useMemo(
    () => (searchTerm
      ? getCanvasAnnotationSearchMatchesOutsideDisplayName(annotation, searchTerm)
      : []),
    [annotation, searchTerm],
  );

  const handleItemClick = useCallback(
    () => onAnnotationClick(annotation.id),
    [onAnnotationClick, annotation.id],
  );
  const handleMenuAction = useCallback(
    (action: CanvasAnnotationAction) => onMenuAction(action, annotation),
    [onMenuAction, annotation],
  );

  return (
    <ObjectListItem<CanvasAnnotationAction>
      itemId={annotation.id}
      displayName={displayName}
      searchTerm={searchTerm}
      externalSearchMatches={externalSearchMatches}
      isEmptyName={!annotation.text.trim()}
      meta={ANNOTATION_META}
      menuId={menuId}
      ariaLabel={`Actions for ${displayName}`}
      actions={OBJECT_LIST_ANNOTATION_ACTIONS}
      onItemClick={handleItemClick}
      onHover={onHoverAnnotation}
      onMenuToggle={onMenuToggle}
      onMenuAction={handleMenuAction}
    />
  );
};

export default memo(AnnotationItem);
