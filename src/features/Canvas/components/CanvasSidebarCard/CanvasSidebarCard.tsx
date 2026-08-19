import { FC, FormEvent, RefObject } from 'react';
import styles from './CanvasSidebarCard.module.scss';
import SidebarCard from '@/features/Sidebar/components/SidebarCard/SidebarCard';
import Button from '@/features/Core/components/Button/Button';
import TrashIcon from '@/assets/icons/buttons/Trash.svg?react';
import EditIcon from '@/assets/icons/buttons/Edit.svg?react';
import WorkspaceIcon from '@/assets/icons/navigation/Workspace.svg?react';
import OutsideClickHandler from '@/features/Core/components/OutsideClickHandler/OutsideClickHandler';
import { getTimeRelativeDate } from '@/features/Core/utils/dateHelpers';
import { getCanvasObjectCountDisplay } from '@/features/Canvas/utils/canvasFunctions';
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
  showUpdatedTime?: boolean;
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
  showUpdatedTime = false,
}) => {
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
      <SidebarCard
        className={isActive ? styles.activeCanvas : ''}
        leftIcon={<WorkspaceIcon />}
        title={isRenaming ? renameValue : canvas.label}
        searchTerm={searchTerm}
        onClick={() => onSelect(canvas)}
        bottomLeft={
          <span className={styles.meta}>
            {getCanvasObjectCountDisplay(canvas, { singular: 'Object', plural: 'Objects' })}
          </span>
        }
        bottomRight={showUpdatedTime ? <span className={styles.meta}>{updatedTime}</span> : undefined}
        options={options}
        isRenaming={isRenaming}
        onTitleChange={onRenameValueChange}
        onFormSubmit={onSubmitRename}
        textInputRef={renameInputRef}
      />
    </OutsideClickHandler>
  );
};

export default CanvasSidebarCard;
