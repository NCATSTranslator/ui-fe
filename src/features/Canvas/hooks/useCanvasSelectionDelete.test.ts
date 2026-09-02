import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useCanvasSelectionDelete from '@/features/Canvas/hooks/useCanvasSelectionDelete';
import {
  makeCanvas,
  makeCanvasEdge,
  makeCanvasNode,
} from '@/features/Canvas/utils/canvasTestFixtures';
import {
  canvasEntitiesRemovedToast,
  canvasEntityRemovedToast,
} from '@/features/Core/utils/toastMessages';

vi.mock('@/features/Core/utils/toastMessages', () => ({
  canvasEntitiesRemovedToast: vi.fn(),
  canvasEntityRemovedToast: vi.fn(),
}));

const canvas = makeCanvas({
  nodes: {
    a: makeCanvasNode('a', { names: ['Aspirin'] }),
    b: makeCanvasNode('b', { names: ['Headache'] }),
    c: makeCanvasNode('c', { names: ['Ibuprofen'] }),
  },
  edges: {
    ab: makeCanvasEdge('ab', 'a', 'b'),
    bc: makeCanvasEdge('bc', 'b', 'c'),
  },
});

const renderDelete = () => {
  const removeElements = vi.fn();
  const clearHover = vi.fn();
  const setSelectedNodeIds = vi.fn();
  const { result } = renderHook(() => useCanvasSelectionDelete({
    activeCanvas: canvas,
    removeElements,
    clearHover,
    setSelectedNodeIds,
  }));
  return { handleDelete: result.current, removeElements, clearHover, setSelectedNodeIds };
};

describe('useCanvasSelectionDelete', () => {
  beforeEach(() => {
    vi.mocked(canvasEntitiesRemovedToast).mockClear();
    vi.mocked(canvasEntityRemovedToast).mockClear();
  });

  it('removes everything the gesture covered in a single call', () => {
    const { handleDelete, removeElements, clearHover, setSelectedNodeIds } = renderDelete();

    handleDelete({ nodes: ['a', 'b'], edges: ['ab', 'bc'] });

    expect(removeElements).toHaveBeenCalledTimes(1);
    expect(removeElements).toHaveBeenCalledWith(['a', 'b'], ['ab', 'bc']);
    expect(clearHover).toHaveBeenCalled();
    expect(setSelectedNodeIds).toHaveBeenCalledWith([]);
  });

  it('names the entity when a single node was removed', () => {
    const { handleDelete } = renderDelete();

    handleDelete({ nodes: ['a'], edges: ['ab'] });

    expect(canvasEntityRemovedToast).toHaveBeenCalledWith('Aspirin');
    expect(canvasEntitiesRemovedToast).not.toHaveBeenCalled();
  });

  it('counts only what the user picked, not the edges dragged along by a node', () => {
    const { handleDelete } = renderDelete();

    // Both edges are incident to the removed nodes, so the count is the two nodes.
    handleDelete({ nodes: ['a', 'b'], edges: ['ab', 'bc'] });

    expect(canvasEntitiesRemovedToast).toHaveBeenCalledWith(2);
  });

  it('counts an edge the user selected on its own', () => {
    const { handleDelete, removeElements } = renderDelete();

    handleDelete({ nodes: [], edges: ['ab'] });

    expect(removeElements).toHaveBeenCalledWith([], ['ab']);
    expect(canvasEntitiesRemovedToast).toHaveBeenCalledWith(1);
  });

  it('ignores ids the canvas no longer holds', () => {
    const { handleDelete, removeElements } = renderDelete();

    handleDelete({ nodes: ['gone'], edges: ['missing'] });

    expect(removeElements).not.toHaveBeenCalled();
    expect(canvasEntitiesRemovedToast).not.toHaveBeenCalled();
  });
});
