import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ReactNode } from 'react';
import canvasReducer from '@/features/Canvas/slices/canvasSlice';
import useCanvasHistory from '@/features/Canvas/hooks/useCanvasHistory';
import type { Canvas } from '@/features/Canvas/types/canvas';
import { makeCanvas } from '@/features/Canvas/utils/canvasTestFixtures';

const renderHistory = (canvas: Canvas) => {
  const store = configureStore({ reducer: { canvas: canvasReducer } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(({ active }: { active: Canvas }) => useCanvasHistory(active), {
    wrapper,
    initialProps: { active: canvas },
  });
};

describe('useCanvasHistory sync handling', () => {
  it('drops undo history when sync replaces the canvas', () => {
    const canvas = makeCanvas();
    const { result, rerender } = renderHistory(canvas);

    act(() => { result.current.pushUndo(); });
    expect(result.current.canUndo).toBe(true);

    // A sync replaced this canvas: the snapshot describes a graph the server no longer has.
    rerender({ active: { ...canvas, syncGeneration: 1 } });
    expect(result.current.canUndo).toBe(false);
  });

  it('keeps undo history across ordinary edits', () => {
    const canvas = makeCanvas();
    const { result, rerender } = renderHistory(canvas);

    act(() => { result.current.pushUndo(); });
    rerender({ active: { ...canvas, timeUpdated: '2026-02-02T00:00:00.000Z' } });
    expect(result.current.canUndo).toBe(true);
  });

  it('keeps undo history when only the server timestamp is adopted', () => {
    // Taking the timestamp of this tab's own write leaves syncGeneration alone, so nothing about
    // the graph on screen has changed and the user's undo stack must survive.
    const canvas = makeCanvas();
    const { result, rerender } = renderHistory(canvas);

    act(() => { result.current.pushUndo(); });
    rerender({ active: { ...canvas, serverTimeUpdated: '2026-01-02T00:00:00.000Z' } });
    expect(result.current.canUndo).toBe(true);
  });

  it('keeps each canvas history separate when switching between them', () => {
    const canvas = makeCanvas();
    const { result, rerender } = renderHistory(canvas);

    act(() => { result.current.pushUndo(); });
    rerender({ active: makeCanvas({ id: 2 }) });
    expect(result.current.canUndo).toBe(false);

    rerender({ active: canvas });
    expect(result.current.canUndo).toBe(true);
  });
});
