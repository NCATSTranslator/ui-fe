import { FC, ReactNode, useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import styles from './CanvasToolbar.module.scss';
import { LayoutType } from 'translator-graph-view';
import useCanvasPane from '@/features/Canvas/hooks/useCanvasPane';
import type { SaveStatus } from '@/features/Canvas/types/canvas';
import UndoIcon from '@/assets/icons/directional/Undo & Redo/Undo.svg?react';
import RedoIcon from '@/assets/icons/directional/Undo & Redo/Redo.svg?react';
import ZoomInIcon from '@/assets/icons/buttons/ZoomIn.svg?react';
import ZoomOutIcon from '@/assets/icons/buttons/ZoomOut.svg?react';
import SubtractIcon from '@/assets/icons/buttons/Subtract/Subtract.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import ExpandIcon from '@/assets/icons/buttons/Expand.svg?react';
import CanvasSettingsMenu from './CanvasSettingsMenu';
import AddMenu from './AddMenu';
import StatusIndicator from './StatusIndicator';
import Button from '@/features/Core/components/Button/Button';

interface CanvasToolbarProps {
  title: string;
  onRename: (title: string) => void;
  layout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onAddObject?: () => void;
  onAddAnnotation?: () => void;
  saveStatus?: SaveStatus;
  rightSlot?: ReactNode;
}

const CanvasToolbar: FC<CanvasToolbarProps> = ({
  title,
  onRename,
  layout,
  onLayoutChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onAddObject,
  onAddAnnotation,
  saveStatus,
  rightSlot,
}) => {
  const { closePane, togglePane, toggleMaximizePane, paneMaximized } = useCanvasPane();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commitRename = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) onRename(trimmed);
    else setEditValue(title);
    setEditing(false);
  }, [editValue, title, onRename]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') { setEditValue(title); setEditing(false); }
  }, [commitRename, title]);

  const displayZoom = (zoomLevel !== null && zoomLevel !== undefined) ? `${Math.round(zoomLevel * 100)}%` : '100%';
  const maximizeLabel = paneMaximized ? 'Restore canvas' : 'Maximize canvas';

  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <div className={styles.interactions}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={closePane}
            aria-label="Close canvas"
            title="Close canvas"
          >
            <CloseIcon />
          </button>
          <button
            type="button"
            className={styles.collapseButton}
            onClick={togglePane}
            aria-label="Collapse canvas"
            title="Collapse canvas"
          >
            <SubtractIcon />
          </button>
          <button
            type="button"
            className={styles.expandButton}
            onClick={toggleMaximizePane}
            aria-label={maximizeLabel}
            title={maximizeLabel}
          >
            <ExpandIcon />
          </button>
        </div>
        {editing ? (
          <input
            ref={inputRef}
            className={styles.titleInput}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span
            className={styles.title}
            onClick={() => { setEditValue(title); setEditing(true); }}
            title="Click to rename"
          >
            {title}
          </span>
        )}
        <StatusIndicator saveStatus={saveStatus} />
      </div>
      <div className={styles.center}>
        <AddMenu onAddObject={onAddObject} onAddAnnotation={onAddAnnotation} />
        <CanvasSettingsMenu layout={layout} onLayoutChange={onLayoutChange} />
        <div className={styles.divider} />
        <div className={styles.zoomGroup}>
          <Button
            className={styles.toolButton}
            handleClick={onZoomIn}
            disabled={!onZoomIn}
            ariaLabel="Zoom in"
            title="Zoom in"
            iconLeft={<ZoomInIcon />}
            iconOnly
            variant="secondary"
          />
          <span className={styles.zoomLevel}>{displayZoom}</span>
          <Button
            className={styles.toolButton}
            handleClick={onZoomOut}
            disabled={!onZoomOut}
            ariaLabel="Zoom out"
            title="Zoom out"
            iconLeft={<ZoomOutIcon />}
            iconOnly
            variant="secondary"
          />
        </div>
        <div className={styles.divider} />
        <div className={styles.undoRedoGroup}>
          <Button
            className={styles.toolButton}
            handleClick={onUndo}
            disabled={!canUndo}
            ariaLabel="Undo"
            title="Undo"
            iconLeft={<UndoIcon />}
            iconOnly
            variant="secondary"
          />
          <Button
            className={styles.toolButton}
            handleClick={onRedo}
            disabled={!canRedo}
            ariaLabel="Redo"
            title="Redo"
            iconLeft={<RedoIcon />}
            iconOnly
            variant="secondary"
          />
        </div>
      </div>
      <div className={styles.right}>
        {rightSlot}
      </div>
    </div>
  );
};

export default CanvasToolbar;
