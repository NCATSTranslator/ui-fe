import { describe, it, expect } from 'vitest';
import {
  canvasLayoutToGraphLayout,
  graphLayoutToCanvasLayout,
  isCustomCanvasLayout,
} from './canvasLayoutUtils';

describe('canvasLayoutUtils', () => {
  it('maps backend layouts to graph layouts', () => {
    expect(canvasLayoutToGraphLayout('horizontal')).toBe('hierarchicalLR');
    expect(canvasLayoutToGraphLayout('vertical')).toBe('hierarchical');
    expect(canvasLayoutToGraphLayout('concentric')).toBe('force');
    expect(canvasLayoutToGraphLayout('custom')).toBe('custom');
  });

  it('maps graph layouts to backend layouts', () => {
    expect(graphLayoutToCanvasLayout('hierarchicalLR')).toBe('horizontal');
    expect(graphLayoutToCanvasLayout('hierarchical')).toBe('vertical');
    expect(graphLayoutToCanvasLayout('force')).toBe('concentric');
    expect(graphLayoutToCanvasLayout('custom')).toBe('custom');
  });

  it('identifies custom canvas layout', () => {
    expect(isCustomCanvasLayout('custom')).toBe(true);
    expect(isCustomCanvasLayout('horizontal')).toBe(false);
  });
});
