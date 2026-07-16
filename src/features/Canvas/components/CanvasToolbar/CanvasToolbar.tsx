import { FC, useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import styles from './CanvasToolbar.module.scss';
import { LayoutType } from 'translator-graph-view';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import useCanvasPane from '@/features/Canvas/hooks/useCanvasPane';
import type { SaveStatus } from '@/features/Canvas/types/canvas';
import UndoIcon from '@/assets/icons/directional/Undo & Redo/Undo.svg?react';
import RedoIcon from '@/assets/icons/directional/Undo & Redo/Redo.svg?react';
import AddIcon from '@/assets/icons/buttons/Add/Add.svg?react';
import SubtractIcon from '@/assets/icons/buttons/Subtract/Subtract.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import SettingsIcon from '@/assets/icons/navigation/Settings.svg?react';
import ExpandIcon from '@/assets/icons/buttons/Expand.svg?react';
import OverflowMenu from './OverflowMenu';
import AddMenu from './AddMenu';
import StatusIndicator from './StatusIndicator';

const layouts: { key: LayoutType; label: string }[] = [
  { key: 'hierarchicalLR', label: 'Horizontal' },
  { key: 'hierarchical', label: 'Vertical' },
  { key: 'force', label: 'Force' },
];

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
  isProcessing?: boolean;
  saveStatus?: SaveStatus;
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
  isProcessing,
  saveStatus,
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
        <AddMenu onAddObject={onAddObject} onAddAnnotation={onAddAnnotation} />
        <StatusIndicator isProcessing={isProcessing} saveStatus={saveStatus} />
      </div>
      <div className={styles.center}>
        <div className={styles.zoomGroup}>
          <button
            className={styles.toolButton}
            onClick={onZoomOut}
            disabled={!onZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <SubtractIcon />
          </button>
          <span className={styles.zoomLevel}>{displayZoom}</span>
          <button
            className={styles.toolButton}
            onClick={onZoomIn}
            disabled={!onZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <AddIcon />
          </button>
        </div>
        <div className={styles.divider} />
        <div className={styles.layoutGroup}>
          {layouts.map(({ key, label }) => (
            <button
              key={key}
              className={joinClasses(styles.layoutButton, layout === key && styles.active)}
              onClick={() => onLayoutChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.right}>
        <button
          className={styles.toolButton}
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo"
        >
          <UndoIcon />
        </button>
        <button
          className={styles.toolButton}
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo"
        >
          <RedoIcon />
        </button>
        <button
          className={styles.toolButton}
          aria-label="Settings"
          title="Settings"
        >
          <SettingsIcon />
        </button>
        <OverflowMenu />
      </div>
    </div>
  );
};

export default CanvasToolbar;
