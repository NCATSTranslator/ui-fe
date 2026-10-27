import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { useCanvasPaneResize } from '@/features/Canvas/hooks/useCanvasPaneResize';
import { CANVAS_PANE_MIN_HEIGHT } from '@/features/Canvas/utils/canvasPaneHeight';

interface Options {
  active?: boolean;
  paneMaximized?: boolean;
  paneHeight?: number | null;
  availableHeight?: number;
}

const renderResize = (options: Options = {}) => {
  const onCommit = vi.fn();
  const view = renderHook(
    (props: Required<Options>) => useCanvasPaneResize({ ...props, onCommit }),
    {
      initialProps: {
        active: options.active ?? true,
        paneMaximized: options.paneMaximized ?? false,
        paneHeight: options.paneHeight ?? 300,
        availableHeight: options.availableHeight ?? 800,
      },
    },
  );
  return { onCommit, view };
};

const pointerEvent = (clientY: number, button = 0) => ({
  button,
  clientY,
  pointerId: 1,
  preventDefault: vi.fn(),
  currentTarget: { setPointerCapture: vi.fn() },
}) as unknown as PointerEvent<HTMLElement>;

const keyEvent = (key: string, shiftKey = false) => ({
  key,
  shiftKey,
  preventDefault: vi.fn(),
}) as unknown as KeyboardEvent<HTMLElement>;

describe('useCanvasPaneResize pointer gestures', () => {
  it('tracks the drag locally and commits once on release', () => {
    const { onCommit, view } = renderResize();
    act(() => view.result.current.handleProps.onPointerDown(pointerEvent(500)));
    act(() => view.result.current.handleProps.onPointerMove(pointerEvent(450)));
    act(() => view.result.current.handleProps.onPointerMove(pointerEvent(400)));
    expect(view.result.current.height).toBe(400);
    expect(view.result.current.dragging).toBe(true);
    expect(onCommit).not.toHaveBeenCalled();

    act(() => view.result.current.handleProps.onPointerUp());
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(400);
    expect(view.result.current.dragging).toBe(false);
  });

  it('does not commit a click without movement', () => {
    const { onCommit, view } = renderResize({ paneMaximized: true });
    act(() => view.result.current.handleProps.onPointerDown(pointerEvent(500)));
    act(() => view.result.current.handleProps.onPointerUp());
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('does not commit a drag that returns to its start', () => {
    const { onCommit, view } = renderResize();
    act(() => view.result.current.handleProps.onPointerDown(pointerEvent(500)));
    act(() => view.result.current.handleProps.onPointerMove(pointerEvent(400)));
    act(() => view.result.current.handleProps.onPointerMove(pointerEvent(500)));
    act(() => view.result.current.handleProps.onPointerUp());
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('ignores non-primary buttons', () => {
    const { view } = renderResize();
    act(() => view.result.current.handleProps.onPointerDown(pointerEvent(500, 2)));
    expect(view.result.current.dragging).toBe(false);
  });

  it('discards an in-progress drag when the handle goes away', () => {
    const { onCommit, view } = renderResize();
    act(() => view.result.current.handleProps.onPointerDown(pointerEvent(500)));
    act(() => view.result.current.handleProps.onPointerMove(pointerEvent(400)));
    view.rerender({ active: false, paneMaximized: true, paneHeight: 300, availableHeight: 800 });
    expect(view.result.current.dragging).toBe(false);
    expect(view.result.current.height).toBe(800);
    expect(onCommit).not.toHaveBeenCalled();

    // A later pointerup over a remounted handle must not commit the stale drag.
    view.rerender({ active: true, paneMaximized: true, paneHeight: 300, availableHeight: 800 });
    act(() => view.result.current.handleProps.onPointerUp());
    expect(onCommit).not.toHaveBeenCalled();
  });
});

describe('useCanvasPaneResize keyboard gestures', () => {
  it('accumulates steps locally and commits once on key release', () => {
    const { onCommit, view } = renderResize();
    act(() => view.result.current.handleProps.onKeyDown(keyEvent('ArrowUp')));
    act(() => view.result.current.handleProps.onKeyDown(keyEvent('ArrowUp')));
    act(() => view.result.current.handleProps.onKeyDown(keyEvent('ArrowUp', true)));
    expect(view.result.current.height).toBe(300 + 16 + 16 + 64);
    expect(view.result.current.dragging).toBe(true);
    expect(onCommit).not.toHaveBeenCalled();

    act(() => view.result.current.handleProps.onKeyUp(keyEvent('ArrowUp')));
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(396);
    expect(view.result.current.dragging).toBe(false);
  });

  it('does not commit repeats held at the clamp bound', () => {
    const { onCommit, view } = renderResize({ paneHeight: 800 });
    act(() => view.result.current.handleProps.onKeyDown(keyEvent('ArrowUp')));
    act(() => view.result.current.handleProps.onKeyDown(keyEvent('ArrowUp')));
    act(() => view.result.current.handleProps.onKeyUp(keyEvent('ArrowUp')));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('jumps to the bounds with Home and End', () => {
    const { onCommit, view } = renderResize();
    act(() => view.result.current.handleProps.onKeyDown(keyEvent('Home')));
    act(() => view.result.current.handleProps.onKeyUp(keyEvent('Home')));
    expect(onCommit).toHaveBeenLastCalledWith(800);

    act(() => view.result.current.handleProps.onKeyDown(keyEvent('End')));
    act(() => view.result.current.handleProps.onKeyUp(keyEvent('End')));
    expect(onCommit).toHaveBeenLastCalledWith(CANVAS_PANE_MIN_HEIGHT);
  });

  it('commits on blur so a gesture never dangles', () => {
    const { onCommit, view } = renderResize();
    act(() => view.result.current.handleProps.onKeyDown(keyEvent('ArrowDown')));
    act(() => view.result.current.handleProps.onBlur());
    expect(onCommit).toHaveBeenCalledWith(284);
    expect(view.result.current.dragging).toBe(false);
  });

  it('ignores unrelated keys', () => {
    const { onCommit, view } = renderResize();
    const event = keyEvent('Tab');
    act(() => view.result.current.handleProps.onKeyDown(event));
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(view.result.current.dragging).toBe(false);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('keeps the handlers stable across a gesture', () => {
    const { view } = renderResize();
    const before = view.result.current.handleProps;
    act(() => view.result.current.handleProps.onPointerDown(pointerEvent(500)));
    act(() => view.result.current.handleProps.onPointerMove(pointerEvent(400)));
    const during = view.result.current.handleProps;
    expect(during.onPointerDown).toBe(before.onPointerDown);
    expect(during.onKeyDown).toBe(before.onKeyDown);
    expect(during.onPointerUp).toBe(before.onPointerUp);
  });
});
