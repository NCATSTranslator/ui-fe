import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import useCanvasKeyboardShortcuts from '@/features/Canvas/hooks/useCanvasKeyboardShortcuts';

const renderShortcuts = (options: { canUndo?: boolean; canRedo?: boolean } = {}) => {
  const undo = vi.fn();
  const redo = vi.fn();
  const view = renderHook(
    ({ canUndo, canRedo }) => useCanvasKeyboardShortcuts({
      undo,
      redo,
      canUndo,
      canRedo,
    }),
    {
      initialProps: {
        canUndo: options.canUndo ?? true,
        canRedo: options.canRedo ?? true,
      },
    },
  );
  return { undo, redo, view };
};

interface PressInit {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

const press = (init: PressInit, target: EventTarget = document) => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
};

describe('useCanvasKeyboardShortcuts', () => {
  it('undoes on cmd+z and ctrl+z', () => {
    const { undo } = renderShortcuts();

    press({ key: 'z', metaKey: true });
    press({ key: 'z', ctrlKey: true });

    expect(undo).toHaveBeenCalledTimes(2);
  });

  it('redoes on cmd+shift+z and ctrl+y', () => {
    const { undo, redo } = renderShortcuts();

    press({ key: 'z', metaKey: true, shiftKey: true });
    press({ key: 'y', ctrlKey: true });

    expect(redo).toHaveBeenCalledTimes(2);
    expect(undo).not.toHaveBeenCalled();
  });

  it('ignores the plain key and other modifier combinations', () => {
    const { undo, redo } = renderShortcuts();

    press({ key: 'z' });
    press({ key: 'z', metaKey: true, altKey: true });
    press({ key: 'a', metaKey: true });

    expect(undo).not.toHaveBeenCalled();
    expect(redo).not.toHaveBeenCalled();
  });

  it('leaves undo to the field when typing in a textarea', () => {
    const { undo } = renderShortcuts();
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    press({ key: 'z', metaKey: true }, textarea);

    expect(undo).not.toHaveBeenCalled();
    textarea.remove();
  });

  it('does not steal the shortcut when there is nothing to undo or redo', () => {
    const { undo, redo } = renderShortcuts({ canUndo: false, canRedo: false });

    const undoEvent = press({ key: 'z', metaKey: true });
    const redoEvent = press({ key: 'z', metaKey: true, shiftKey: true });

    expect(undo).not.toHaveBeenCalled();
    expect(redo).not.toHaveBeenCalled();
    expect(undoEvent.defaultPrevented).toBe(false);
    expect(redoEvent.defaultPrevented).toBe(false);
  });

  it('picks up canUndo/canRedo changes without rebinding', () => {
    const { undo, redo, view } = renderShortcuts({ canUndo: false, canRedo: false });

    press({ key: 'z', metaKey: true });
    expect(undo).not.toHaveBeenCalled();

    view.rerender({ canUndo: true, canRedo: true });
    press({ key: 'z', metaKey: true });
    press({ key: 'y', ctrlKey: true });

    expect(undo).toHaveBeenCalledTimes(1);
    expect(redo).toHaveBeenCalledTimes(1);
  });

  it('stops listening once unmounted', () => {
    const { undo, view } = renderShortcuts();
    view.unmount();

    press({ key: 'z', metaKey: true });

    expect(undo).not.toHaveBeenCalled();
  });
});
