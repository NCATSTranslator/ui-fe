import { FC, ReactNode, CSSProperties } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { joinClasses } from '@/features/Common/utils/utilities';
import styles from './DraggableCard.module.scss';
import { DraggableData } from '@/features/DragAndDrop/types/types';

export interface DraggableCardProps {
  id: string;
  data?: DraggableData;
  children: ReactNode | ((props: { isDragging: boolean }) => ReactNode);
  className?: string;
  disabled?: boolean;
  style?: CSSProperties;
  'data-testid'?: string;
}

/**
 * DraggableCard - Makes any content draggable
 * 
 * @example
 * // Simple usage
 * <DraggableCard id="query-1" data={queryData}>
 *   <QueryCard />
 * </DraggableCard>
 * 
 * @example
 * // With render function for dynamic styling
 * <DraggableCard id="query-1" data={queryData}>
 *   {({ isDragging }) => (
 *     <QueryCard className={isDragging ? 'dragging' : ''} />
 *   )}
 * </DraggableCard>
 */
export const DraggableCard: FC<DraggableCardProps> = ({ 
  id, 
  data, 
  children, 
  className,
  disabled = false,
  style,
  'data-testid': testId,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data,
    disabled,
  });

  const cardClassName = joinClasses(
    styles.draggableCard,
    className,
    isDragging && styles.dragging,
    disabled && styles.disabled
  );

  return (
    <div
      ref={setNodeRef}
      style={{...style}}
      className={cardClassName}
      data-draggable-id={id}
      data-is-dragging={isDragging}
      data-disabled={disabled}
      data-testid={testId}
      {...listeners}
      {...attributes}
    >
      {typeof children === 'function' ? children({ isDragging }) : children}
    </div>
  );
};