import { FC, FormEvent, RefObject } from 'react';
import styles from './CanvasSidebarCard.module.scss';
import SidebarCard from '@/features/Sidebar/components/SidebarCard/SidebarCard';
import Button from '@/features/Core/components/Button/Button';
import TrashIcon from '@/assets/icons/buttons/Trash.svg?react';
import EditIcon from '@/assets/icons/buttons/Edit.svg?react';
import CanvasIcon from '@/assets/icons/navigation/Canvas.svg?react';
import OutsideClickHandler from '@/features/Core/components/OutsideClickHandler/OutsideClickHandler';
import { getCanvasObjectCountDisplay } from '@/features/Canvas/utils/canvasFunctions';
import { useCanvasEntityDrop } from '@/features/Canvas/hooks/useCanvasEntityDrop';
import { DroppableArea } from '@/features/DragAndDrop/components/DroppableArea/DroppableArea';
import { isResultEntityDragData } from '@/features/DragAndDrop/types/types';
import type { Canvas } from '@/features/Canvas/types/canvas';

interface CanvasSidebarCardProps {
  canvas: Canvas;
  isActive: boolean;
  isRenaming: boolean;
  renameValue: string;
  searchTerm: string;
  renameInputRef: RefObject<HTMLInputElement | null>;
  onSelect: (canvas: Canvas) => void;
  onStartRename: (canvas: Canvas) => void;
  onDelete: (canvasId: number) => void;
  onRenameValueChange: (value: string) => void;
  onSubmitRename: (e?: FormEvent<HTMLFormElement>) => void;
}

const CanvasSidebarCard: FC<CanvasSidebarCardProps> = ({
  canvas,
  isActive,
  isRenaming,
  renameValue,
  searchTerm,
  renameInputRef,
  onSelect,
  onStartRename,
  onDelete,
  onRenameValueChange,
  onSubmitRename,
}) => {
  const handleEntityDrop = useCanvasEntityDrop(canvas);

  const options = (
    <>
      <Button handleClick={() => onStartRename(canvas)} iconLeft={<EditIcon />}>Rename</Button>
      <Button handleClick={() => onDelete(canvas.id)} iconLeft={<TrashIcon />}>Delete</Button>
    </>
  );

  return (
    <OutsideClickHandler
      onOutsideClick={() => {
        if (isRenaming) onSubmitRename();
      }}
    >
      <DroppableArea
        id={`canvas-card-zone-${canvas.id}`}
        // No target until the graph is in: a drop would place nodes against an empty canvas.
        disabled={!canvas.graphLoaded}
        canAccept={isResultEntityDragData}
        data={{ type: 'canvas', id: String(canvas.id), onDrop: handleEntityDrop }}
        indicatorText={`Add to ${canvas.label}`}
        indicatorClass={styles.dropIndicator}
        indicateOnlyOnOver
      >
        <SidebarCard
          className={isActive ? styles.activeCanvas : ''}
          leftIcon={<CanvasIcon />}
          title={isRenaming ? renameValue : canvas.label}
          searchTerm={searchTerm}
          onClick={() => onSelect(canvas)}
          bottomLeft={
            <span className={styles.meta}>
              {getCanvasObjectCountDisplay(canvas, { singular: 'Object', plural: 'Objects' })}
            </span>
          }
          options={options}
          isRenaming={isRenaming}
          onTitleChange={onRenameValueChange}
          onFormSubmit={onSubmitRename}
          textInputRef={renameInputRef}
        />
      </DroppableArea>
    </OutsideClickHandler>
  );
};

export default CanvasSidebarCard;
