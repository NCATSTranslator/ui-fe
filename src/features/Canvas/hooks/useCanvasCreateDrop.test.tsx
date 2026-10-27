import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import canvasReducer from '@/features/Canvas/slices/canvasSlice';
import { useCanvasCreateDrop } from '@/features/Canvas/hooks/useCanvasCreateDrop';
import { addResultEntityToCanvas, resultEntityTargetFromDrag } from '@/features/Canvas/utils/addResultEntityToCanvas';
import useCreateCanvas from '@/features/Canvas/hooks/useCreateCanvas';
import { getResultSetById } from '@/features/ResultList/slices/resultsSlice';
import { canvasSaveErrorToast } from '@/features/Core/utils/toastMessages';
import { makeCanvas } from '@/features/Canvas/utils/canvasTestFixtures';
import type { DraggableData } from '@/features/DragAndDrop/types/types';
import type { Path, ResultSet } from '@/features/ResultList/types/results';

vi.mock('@/features/Canvas/utils/addResultEntityToCanvas', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/Canvas/utils/addResultEntityToCanvas')>();
  return { ...actual, addResultEntityToCanvas: vi.fn() };
});
vi.mock('@/features/Canvas/hooks/useCreateCanvas', () => ({ default: vi.fn() }));
vi.mock('@/features/ResultList/slices/resultsSlice', () => ({ getResultSetById: vi.fn() }));
vi.mock('@/features/Core/utils/toastMessages', () => ({ canvasSaveErrorToast: vi.fn() }));

const resultSet = { data: {} } as unknown as ResultSet;
const nodeDrag: DraggableData = { type: 'node', data: { id: 'n1', pk: 'pk1' } };

const renderCreateDrop = () => {
  const store = configureStore({ reducer: { canvas: canvasReducer } });
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
  return renderHook(() => useCanvasCreateDrop(), { wrapper });
};

describe('resultEntityTargetFromDrag', () => {
  it('ignores non-result drags', () => {
    const queryDrag = { type: 'query', data: {} } as unknown as DraggableData;
    expect(resultEntityTargetFromDrag(queryDrag)).toBeNull();
  });

  it('carries edge ids and paths through to the target', () => {
    const path = { id: 'p1' } as unknown as Path;
    expect(resultEntityTargetFromDrag({ type: 'edge', data: { id: 'e1', pk: 'pk1', edgeIds: ['e1', 'e2'] } }))
      .toEqual({ type: 'edge', id: 'e1', pk: 'pk1', path: undefined, edgeIds: ['e1', 'e2'] });
    expect(resultEntityTargetFromDrag({ type: 'path', data: { id: 'p1', pk: 'pk1', path } }))
      .toEqual({ type: 'path', id: 'p1', pk: 'pk1', path, edgeIds: undefined });
  });
});

describe('useCanvasCreateDrop', () => {
  const handleCreateCanvas = vi.fn();

  beforeEach(() => {
    vi.mocked(addResultEntityToCanvas).mockReset();
    handleCreateCanvas.mockReset();
    vi.mocked(useCreateCanvas).mockReturnValue({ handleCreateCanvas, createCanvas: vi.fn() });
    vi.mocked(getResultSetById).mockReturnValue(() => resultSet);
  });

  it('creates a canvas, then adds the dropped entity to it as a drag add', async () => {
    const created = makeCanvas({ id: 7, label: 'Canvas 7' });
    handleCreateCanvas.mockResolvedValue(created);
    const { result } = renderCreateDrop();

    await act(async () => { await result.current(nodeDrag); });

    expect(handleCreateCanvas).toHaveBeenCalledTimes(1);
    expect(addResultEntityToCanvas).toHaveBeenCalledTimes(1);
    expect(vi.mocked(addResultEntityToCanvas).mock.calls[0][0]).toMatchObject({
      resultSet,
      canvas: created,
      target: { type: 'node', id: 'n1', pk: 'pk1' },
      addMethod: 'drag',
    });
  });

  it('toasts instead of rejecting when the add fails after the canvas is created', async () => {
    handleCreateCanvas.mockResolvedValue(makeCanvas({ id: 7 }));
    vi.mocked(addResultEntityToCanvas).mockRejectedValue(new Error('bad payload'));
    const { result } = renderCreateDrop();

    await act(async () => { await result.current(nodeDrag); });
    expect(canvasSaveErrorToast).toHaveBeenCalledTimes(1);
  });

  it('does not add when canvas creation fails', async () => {
    handleCreateCanvas.mockResolvedValue(null);
    const { result } = renderCreateDrop();

    await act(async () => { await result.current(nodeDrag); });

    expect(addResultEntityToCanvas).not.toHaveBeenCalled();
  });

  it('does not create a canvas for a non-result drag or a missing result set', async () => {
    const { result } = renderCreateDrop();

    await act(async () => {
      await result.current({ type: 'query', data: {} } as unknown as DraggableData);
    });
    expect(handleCreateCanvas).not.toHaveBeenCalled();

    vi.mocked(getResultSetById).mockReturnValue(() => null);
    await act(async () => { await result.current(nodeDrag); });
    expect(handleCreateCanvas).not.toHaveBeenCalled();
  });
});
