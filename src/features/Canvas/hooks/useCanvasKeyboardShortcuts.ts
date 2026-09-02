import { useEffect, useRef } from 'react';

interface UseCanvasKeyboardShortcutsOptions {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/* Typing in a field owns its own undo stack, so the canvas keeps out of those keystrokes. */
const isTextEntryTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return target.tagName === 'INPUT'
    || target.tagName === 'TEXTAREA'
    || target.tagName === 'SELECT';
};

/**
 * Canvas-wide undo/redo shortcuts: cmd/ctrl+Z and cmd/ctrl+shift+Z, plus ctrl+Y for the
 * Windows convention. Bound to the document rather than the graph surface so they work
 * wherever focus sits in the pane, which means calling this only from a component that
 * lives as long as the open canvas does. Delete/Backspace is not here — the graph
 * reports that gesture through its own selection-delete callback.
 */
const useCanvasKeyboardShortcuts = ({
  undo,
  redo,
  canUndo,
  canRedo,
}: UseCanvasKeyboardShortcutsOptions) => {
  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  const canUndoRef = useRef(canUndo);
  const canRedoRef = useRef(canRedo);
  undoRef.current = undo;
  redoRef.current = redo;
  canUndoRef.current = canUndo;
  canRedoRef.current = canRedo;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      const isUndo = key === 'z' && !event.shiftKey;
      const isRedo = (key === 'z' && event.shiftKey) || key === 'y';
      if (!isUndo && !isRedo) return;
      if (isTextEntryTarget(event.target)) return;

      if (isUndo) {
        if (!canUndoRef.current) return;
        event.preventDefault();
        undoRef.current();
        return;
      }
      if (!canRedoRef.current) return;
      event.preventDefault();
      redoRef.current();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};

export default useCanvasKeyboardShortcuts;
