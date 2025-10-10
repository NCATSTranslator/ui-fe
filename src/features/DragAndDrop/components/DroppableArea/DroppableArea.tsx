import { FC, ReactNode, CSSProperties, useMemo } from 'react';
import { useDndContext, useDroppable } from '@dnd-kit/core';
import { joinClasses } from '@/features/Common/utils/utilities';
import styles from './DroppableArea.module.scss';
import { DraggableData, DroppableAreaData } from '@/features/DragAndDrop/types/types';

export interface DroppableAreaProps {
  id: string;
  data?: DroppableAreaData;
  children: ReactNode | ((props: { isOver: boolean }) => ReactNode);
  className?: string;
  disabled?: boolean;
  style?: CSSProperties;
  hideIndicator?: boolean;
  indicatorText?: string;
  indicatorStatus?: 'default' | 'error';
  'data-testid'?: string;
  canAccept?: (draggedData: DraggableData) => boolean;
  indicateOnlyOnOver?: boolean;
}

export const DroppableArea: FC<DroppableAreaProps> = ({
  id,
  data,
  children,
  className,
  disabled = false,
  style,
  hideIndicator = false,
  indicatorText = 'Drop here',
  indicatorStatus = 'default',
  'data-testid': testId,
  canAccept,
  indicateOnlyOnOver = false,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data,
    disabled,
  });

  const { active } = useDndContext();

  const isDraggingCompatibleItem = useMemo(() => {
    if (!active || disabled) return false;
    if (!canAccept) return true; // If no filter, accept any dragged item
    return canAccept(active.data.current as DraggableData);
  }, [active, canAccept, disabled]);

  // Show active styles when either hovering OR when dragging a compatible item
  const shouldShowActive = (isOver || (isDraggingCompatibleItem && !indicateOnlyOnOver)) && !disabled;

  const containerClassName = useMemo(() => 
    joinClasses(
      styles.droppableArea,
      className,
      shouldShowActive && styles.over,
      disabled && styles.disabled,
      indicatorStatus && styles[indicatorStatus]
    ),
    [className, shouldShowActive, disabled, indicatorStatus]
  );

  const indicatorClassName = useMemo(() => 
    joinClasses(
      styles.dropIndicator,
      (!hideIndicator && shouldShowActive) && styles.show,
    ),
    [hideIndicator, shouldShowActive]
  );

  return (
    <div
      ref={setNodeRef}
      className={containerClassName}
      style={style}
      data-droppable-id={id}
      data-is-over={isOver}
      data-disabled={disabled}
      data-testid={testId}
    >
      {typeof children === 'function' ? children({ isOver }) : children}
      
      <div className={indicatorClassName}>
        {indicatorText}
      </div>
    </div>
  );
};

