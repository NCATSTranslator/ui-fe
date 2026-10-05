import { FC, FormEvent, RefObject } from 'react';
import styles from '@/features/Projects/components/DataCard/DataCard.module.scss';
import DataCard from '@/features/Projects/components/DataCard/DataCard';
import Button from '@/features/Core/components/Button/Button';
import TrashIcon from '@/assets/icons/buttons/Trash.svg?react';
import EditIcon from '@/assets/icons/buttons/Edit.svg?react';
import CanvasIcon from '@/assets/icons/navigation/Canvas.svg?react';
import OutsideClickHandler from '@/features/Core/components/OutsideClickHandler/OutsideClickHandler';
import { getTimeRelativeDate } from '@/features/Core/utils/dateHelpers';
import { getCanvasObjectCountDisplay, getCanvasRelationshipCountDisplay } from '@/features/Canvas/utils/canvasFunctions';
import type { Canvas } from '@/features/Canvas/types/canvas';

interface CanvasCardProps {
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

const CanvasCard: FC<CanvasCardProps> = ({
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
  const createdTime = getTimeRelativeDate(new Date(canvas.timeCreated));
  const updatedTime = getTimeRelativeDate(new Date(canvas.timeUpdated));
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
      <DataCard
        icon={<CanvasIcon />}
        title={isRenaming ? renameValue : canvas.label}
        searchTerm={searchTerm}
        onClick={() => onSelect(canvas)}
        className={isActive ? styles.activeCanvas : undefined}
        options={options}
        isRenaming={isRenaming}
        onTitleChange={onRenameValueChange}
        onFormSubmit={onSubmitRename}
        textInputRef={renameInputRef}
        type="canvas"
        objectCountLabel={getCanvasObjectCountDisplay(canvas, { singular: 'Object', plural: 'Objects' })}
        relationshipCountLabel={getCanvasRelationshipCountDisplay(canvas, { singular: 'Relationship', plural: 'Relationships' })}
        createdTime={createdTime}
        lastSeenTime={updatedTime}
      />
    </OutsideClickHandler>
  );
};

export default CanvasCard;
