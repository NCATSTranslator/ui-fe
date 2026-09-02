import { describe, expect, it, vi, beforeEach } from 'vitest';
import { finalizeCanvasElementRemoval } from '@/features/Canvas/utils/canvasRemovalUi';
import {
  canvasEntitiesRemovedToast,
  canvasEntityRemovedToast,
} from '@/features/Core/utils/toastMessages';

vi.mock('@/features/Core/utils/toastMessages', () => ({
  canvasEntitiesRemovedToast: vi.fn(),
  canvasEntityRemovedToast: vi.fn(),
}));

describe('finalizeCanvasElementRemoval', () => {
  const clearHover = vi.fn();
  const setSelectedNodeIds = vi.fn();

  beforeEach(() => {
    clearHover.mockClear();
    setSelectedNodeIds.mockClear();
    vi.mocked(canvasEntitiesRemovedToast).mockClear();
    vi.mocked(canvasEntityRemovedToast).mockClear();
  });

  it('clears selection UI and names a single removed entity', () => {
    finalizeCanvasElementRemoval({
      clearHover,
      setSelectedNodeIds,
      pickedCount: 1,
      singleEntityName: 'Aspirin',
    });

    expect(clearHover).toHaveBeenCalled();
    expect(setSelectedNodeIds).toHaveBeenCalledWith([]);
    expect(canvasEntityRemovedToast).toHaveBeenCalledWith('Aspirin');
    expect(canvasEntitiesRemovedToast).not.toHaveBeenCalled();
  });

  it('uses a count toast when several items were picked', () => {
    finalizeCanvasElementRemoval({
      clearHover,
      setSelectedNodeIds,
      pickedCount: 3,
    });

    expect(canvasEntitiesRemovedToast).toHaveBeenCalledWith(3);
    expect(canvasEntityRemovedToast).not.toHaveBeenCalled();
  });

  it('uses a count toast for a single unnamed pick such as an edge', () => {
    finalizeCanvasElementRemoval({
      clearHover,
      setSelectedNodeIds,
      pickedCount: 1,
    });

    expect(canvasEntitiesRemovedToast).toHaveBeenCalledWith(1);
    expect(canvasEntityRemovedToast).not.toHaveBeenCalled();
  });
});
