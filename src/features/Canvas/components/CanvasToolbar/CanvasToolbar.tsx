import { FC, useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import styles from './CanvasToolbar.module.scss';
import { LayoutType } from 'translator-graph-view';
import { joinClasses } from '@/features/Core/utils/classHelpers';
import OutsideClickHandler from '@/features/Core/components/OutsideClickHandler/OutsideClickHandler';
import UndoIcon from '@/assets/icons/directional/Undo & Redo/Undo.svg?react';
import RedoIcon from '@/assets/icons/directional/Undo & Redo/Redo.svg?react';
import AddIcon from '@/assets/icons/buttons/Add/Add.svg?react';
import CircleAddIcon from '@/assets/icons/buttons/Add/Circle Add.svg?react';
import SubtractIcon from '@/assets/icons/buttons/Subtract/Subtract.svg?react';
import SettingsIcon from '@/assets/icons/navigation/Settings.svg?react';
import OverflowIcon from '@/assets/icons/buttons/Dot Menu/Vertical Dot Menu.svg?react';

const OverflowMenu: FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <OutsideClickHandler className={styles.overflowWrapper} onOutsideClick={() => setOpen(false)}>
      <button
        className={joinClasses(styles.toolButton, open && styles.active)}
        onClick={() => setOpen(prev => !prev)}
        aria-label="More options"
        title="More options"
      >
        <OverflowIcon />
      </button>
      {open && (
        <div className={styles.overflowMenu}>
          <button className={styles.overflowItem} onClick={() => setOpen(false)} disabled>
            Export Canvas
          </button>
          <button className={styles.overflowItem} onClick={() => setOpen(false)} disabled>
            Duplicate Canvas
          </button>
        </div>
      )}
    </OutsideClickHandler>
  );
};

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
}) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
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

  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
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
        <OutsideClickHandler className={styles.addMenuWrapper} onOutsideClick={() => setAddMenuOpen(false)}>
          <button
            className={joinClasses(styles.addButton, addMenuOpen && styles.active)}
            onClick={() => setAddMenuOpen(prev => !prev)}
            aria-label="Add to canvas"
            title="Add to canvas"
          >
            <CircleAddIcon />
            <span>Add</span>
          </button>
          {addMenuOpen && (
            <div className={styles.addMenu}>
              <button
                className={styles.addMenuItem}
                onClick={() => { setAddMenuOpen(false); onAddObject?.(); }}
              >
                Object
              </button>
              <button
                className={styles.addMenuItem}
                onClick={() => { setAddMenuOpen(false); onAddAnnotation?.(); }}
              >
                Annotation
              </button>
            </div>
          )}
        </OutsideClickHandler>
        {isProcessing && <span className={styles.processingIndicator}>Processing...</span>}
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
