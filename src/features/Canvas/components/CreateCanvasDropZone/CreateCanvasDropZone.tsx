import { FC, ReactNode } from 'react';
import Button from '@/features/Core/components/Button/Button';
import AddIcon from '@/assets/icons/buttons/Add/Add.svg?react';
import useCreateCanvas from '@/features/Canvas/hooks/useCreateCanvas';
import { useCanvasCreateDrop } from '@/features/Canvas/hooks/useCanvasCreateDrop';
import { DroppableArea } from '@/features/DragAndDrop/components/DroppableArea/DroppableArea';
import { isResultEntityDragData } from '@/features/DragAndDrop/types/types';

interface CreateCanvasDropZoneProps {
  id: string;
  className?: string;
  indicatorClass?: string;
  children: ReactNode;
}

/**
 * Drop target that creates a new canvas holding the dropped result entity. Wraps a
 * `CreateCanvasButton` (or any layout around one) so the pane pill and the sidebar
 * panel share one drop wiring.
 */
export const CreateCanvasDropZone: FC<CreateCanvasDropZoneProps> = ({
  id,
  className,
  indicatorClass,
  children,
}) => {
  const handleCreateDrop = useCanvasCreateDrop();

  return (
    <DroppableArea
      id={id}
      className={className}
      canAccept={isResultEntityDragData}
      data={{ type: 'canvas', onDrop: handleCreateDrop }}
      indicatorText="Create & Add"
      indicatorClass={indicatorClass}
      indicateOnlyOnOver
    >
      {children}
    </DroppableArea>
  );
};

interface CreateCanvasButtonProps {
  className?: string;
  ariaLabel?: string;
  title?: string;
}

/** The "Create New Canvas" button; a click creates an empty canvas. */
export const CreateCanvasButton: FC<CreateCanvasButtonProps> = ({ className, ariaLabel, title }) => {
  const { createCanvas } = useCreateCanvas();

  return (
    <Button
      className={className}
      handleClick={createCanvas}
      ariaLabel={ariaLabel}
      title={title}
      iconLeft={<AddIcon />}
    >
      Create New Canvas
    </Button>
  );
};
